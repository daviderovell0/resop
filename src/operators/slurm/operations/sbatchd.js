import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription('sbatch direct: sbatch taking an input files as option');

opn.defineOptions({ script: 'SBATCH submission script (as string)' });

async function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  const script = await opn.runOperation('utils', 'tempFile', {
    content: opn.options.script,
  });
  opn.addLog(script);

  return opn.runCommand(`sbatch -o $HOME/slurm-%j ${script}`);
}

opn.set(exec);

export default opn;
