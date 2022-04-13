/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription(
  'Generate usage per CPUcore reports from Slurm database. Simplified sreport with more options'
);
opn.defineOptions({
  type: 'user/project(account)/cluster. Default: project',
  unit: 'hours/minutes/seconds/percent. Default: hours',
  start:
    'report start date. format DD, DD/MM, DD/MM/YYYY. Default: yesterday 00:00',
  end: 'report start date. format DD, DD/MM, DD/MM/YYYY. Default: yesterday 23:59',
  names: 'user or project name or list of names separated by commas',
  nameStartsWith: 'sequence of characters the name starts with',
  nameEndsWith: 'sequence of characters the name ends with',
  nameContains: 'sequence of characters in the name',
  total: 'true/false. Default: false. Sum values in case of multiple results',
});

function formatDate(date) {
  const now = new Date();
  if (!date) return '';
  if (date.length === 2) {
    const month = now.getMonth() < 10 ? `0${now.getMonth()}` : now.getMonth();
    return `${now.getFullYear()}-${month}-${date}`;
  }
  if (date.length === 5) {
    date = `${date.slice(3, 5)}-${date.slice(0, 2)}`;
    return `${now.getFullYear()}-${date}`;
  }
  if (date.length === 10) {
    date = `${date.slice(6, 10)}-${date.slice(3, 5)}-${date.slice(0, 2)}`;
    return date;
  }
  return -1;
}
async function exec() {
  // format, init, check inputs

  // type
  let type = 'account';
  let unit = 'hours';

  if (opn.options.type === 'project') type = 'account';
  if (
    opn.options.type === 'user' ||
    opn.options.type === 'account' ||
    opn.options.type === 'cluster'
  ) {
    type = opn.options.type;
  } else {
    opn.addLog('Unspecified/Unrecognised type, defaulting to type=account');
  }

  // dates
  const start = formatDate(opn.options.start);
  const end = formatDate(opn.options.end);
  if (start === -1 || end === -1) {
    opn.error('Wrong date format for start/end opetions.');
  }

  if (
    opn.options.unit === 'hours' ||
    opn.options.unit === 'minutes' ||
    opn.options.unit === 'seconds' ||
    opn.options.unit === 'percent'
  ) {
    unit = opn.options.unit;
  } else {
    opn.addLog('unit = hours');
  }

  // CLUSTER report
  if (opn.options.type === 'cluster') {
    opn.addLog('Generating cluster usage report');
    const out = await opn.runCommand(
      `sreport -Pn -t ${unit} cluster utilisation ` +
        `start=${start} end=${end}`
    );
    const outl = out.split('|');
    return {
      cluster: outl[0],
      allocated: outl[1],
      down: outl[2],
      pnldDown: outl[3],
      idle: outl[4],
      reserved: outl[5],
      total: outl[6],
    };
  }

  // PROJECT (SLURM ACCOUNT) and USER report
  let { names } = opn.options;
  let utilisationby;
  let sreportFormat;
  if (type === 'account') {
    utilisationby = 'userutilizationbyaccount';
    sreportFormat = 'login,used';
  }
  if (type === 'user') {
    utilisationby = 'accountutilizationbyuser';
    sreportFormat = 'account,used';
  }
  // filter namestartswith
  if (opn.options.nameStartsWith) {
    const out = await opn.runCommand(
      `sacctmgr show ${type} withass format=${type} -P`
    );
    names = '';
    out.split('\n').forEach((v) => {
      if (v.startsWith(opn.options.nameStartsWith)) {
        names += `${v},`;
      }
    });
    console.log(names);
    opn.addLog(`${type}s found=${names}`);
  }

  // filter total
  if (opn.options.total === 'true') {
    const out = await opn.runCommand(
      `sreport -Pn  -t ${unit} cluster ${utilisationby} ` +
        `${type}=${names} start=${start} end=${end} format=used`
    );
    let total = 0;
    out.split('\n').forEach((v) => {
      total += Number(v);
    });
    return total;
  }

  // normal execution
  const out = await opn.runCommand(
    `sreport -Pn  -t ${unit} cluster ${utilisationby} ` +
      `${type}=${names} start=${start} end=${end} format=${sreportFormat}`
  );
  const outJSON = {};
  // when specifing multiple projects or users
  // we can have 1 entry multiple times
  // (i.e. when a user has 2+ accounts)
  // the following the hours for a single "subject" (user or account)
  out.split('\n').forEach((v) => {
    const subject = v.split('|')[0];
    const usage = Number(v.split('|')[1]);
    // check if  already a value, if not init to 0
    if (!outJSON[subject]) outJSON[subject] = 0;
    // sum in case user have accounted on multiple projects
    outJSON[subject] += usage;
  });
  console.log(outJSON);
  return outJSON;
}

opn.set(exec);
export default opn;
