/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable function-paren-newline */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription(
  'Generate usage-per-CPUcore reports from Slurm database. Simplified sreport with more options'
);
opn.defineOptions({
  type: 'user/project(account)/cluster. Default: project',
  unit: 'hours/minutes/seconds/percent. Default: hours',
  start:
    'report start date. format DD, DD/MM, DD/MM/YYYY, MM/YYYY. Default: yesterday 00:00',
  end: 'report start date. format DD, DD/MM, DD/MM/YYYY, MM/YYYY. Default: yesterday 23:59',
  names: 'user or project name or list of names separated by commas',
  nameStartsWith: 'sequence of characters the name starts with',
  nameEndsWith: 'sequence of characters the name ends with',
  nameContains: 'sequence of characters in the name',
  total: 'true/false. Default: false. Sum values in case of multiple results',
  monthly:
    'true/false. Default: false. Show values month by month.' +
    'Days specified in the date are discarded',
});

function formatDate(date) {
  const now = new Date();
  if (!date) return '';
  if (date.length === 2) {
    // DD
    const month = now.getMonth() < 10 ? `0${now.getMonth()}` : now.getMonth();
    return `${now.getFullYear()}-${month}-${date}`;
  }
  if (date.length === 5) {
    // DD/MM
    return `${now.getFullYear()}-${date.slice(3, 5)}-${date.slice(0, 2)}`;
  }
  if (date.length === 7) {
    // MM/YYYY
    date = `${date.slice(3, 7)}-${date.slice(0, 2)}-01`;
    return date;
  }
  if (date.length === 10) {
    // DD/MM/YYYY
    date = `${date.slice(6, 10)}-${date.slice(3, 5)}-${date.slice(0, 2)}`;
    return date;
  }
  return -1;
}

function exec() {
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
    opn.error('Wrong date format for start/end operations.');
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
    const out = opn.runCommand(
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

  /**
   *   PROJECT (SLURM ACCOUNT) and USER report
   */
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

  // > filters
  let entityList = []; // list users or accounts
  if (opn.options.nameStartsWith || opn.options.nameEndsWith) {
    const allEntities = opn.runCommand(
      `sacctmgr show ${type} format=${type} -Pn`
    );
    entityList = allEntities.split('\n');
  }
  // filter namestartswith
  if (opn.options.nameStartsWith) {
    entityList = entityList.filter((v) =>
      v.startsWith(opn.options.nameStartsWith)
    );
  }
  // filter nameEndswith
  if (opn.options.nameEndsWith) {
    entityList = entityList.filter((v) => v.endsWith(opn.options.nameEndsWith));
  }
  // filter nameContains
  if (opn.options.nameContains) {
    entityList = entityList.filter((v) => v.includes(opn.options.nameContains));
  }

  // either choose the filtered list of names or, if no filters used,
  // the name(s) specifies in the original request
  let names;
  if (entityList.length > 0) {
    names = entityList.join(',');
    console.log(names);
    opn.addLog(`filter result: type=${type}, found=${names}`);
  } else {
    names = opn.options.names;
  }

  // > generate report
  // total
  if (opn.options.total === 'true') {
    const out = opn.runCommand(
      `sreport -Pn -t ${unit} cluster ${utilisationby} ` +
        `${type}=${names} start=${start} end=${end} format=used`
    );
    let total = 0;
    out.split('\n').forEach((v) => {
      total += Number(v);
    });
    return total;
  }

  // monthly
  if (opn.options.monthly === 'true') {
    const startYear = Number(start.slice(0, 4));
    const startMonth = Number(start.slice(5, 7));
    const endYear = Number(end.slice(0, 4));
    const endMonth = Number(end.slice(5, 7));

    // date format checks
    if (startYear > endYear) {
      opn.error('wrong dates format: end date is before start date');
    }
    if (startYear === endYear && startMonth > endMonth) {
      opn.error('wrong dates format: end date is before start date');
    }

    let m = startMonth;
    let y = startYear;
    const monthlyOutJSON = {};
    for (y; y <= endYear; y += 1) {
      for (m; m < 13; m += 1) {
        const mString = m < 10 ? `0${m}` : m;

        // almost copy of "normal execution"
        // TODO? do this in a smarter way, maybe put it in a function
        const out = opn.runCommand(
          `sreport -Pn -t ${unit} cluster ${utilisationby} ` +
            `${type}=${names} start=${y}-${mString}-01 end=${y}-${mString}-31 format=${sreportFormat}`
        );
        if (!out) {
          monthlyOutJSON[`${m}/${y}`] = 0;
          continue;
        }
        const outJSON = {};
        // when specifing multiple projects or users
        // we can have 1 entry multiple times
        // (i.e. when a user has 2+ accounts)
        // the following the hours for a single "entity" (user or account)
        out.split('\n').forEach((v) => {
          const entity = v.split('|')[0];
          const usage = Number(v.split('|')[1]);
          // check if  already a value, if not init to 0
          if (!outJSON[entity]) outJSON[entity] = 0;
          // sum in case user have accounted on multiple projects
          outJSON[entity] += usage;
        });

        monthlyOutJSON[`${m}/${y}`] = outJSON;
        if (m === endMonth) break;
      }
      m = 1;
    }
    return monthlyOutJSON;
  }

  // normal execution
  const out = opn.runCommand(
    `sreport -Pn -t ${unit} cluster ${utilisationby} ` +
      `${type}=${names} start=${start} end=${end} format=${sreportFormat}`
  );
  if (!out) return 0;
  const outJSON = {};
  // when specifing multiple projects or users
  // we can have 1 entry multiple times
  // (i.e. when a user has 2+ accounts)
  // the following the hours for a single "entity" (user or account)
  out.split('\n').forEach((v) => {
    const entity = v.split('|')[0];
    const usage = Number(v.split('|')[1]);
    // check if  already a value, if not init to 0
    if (!outJSON[entity]) outJSON[entity] = 0;
    // sum in case user have accounted on multiple projects
    outJSON[entity] += usage;
  });
  console.log(outJSON);
  return outJSON;
}

opn.set(exec);
export default opn;
