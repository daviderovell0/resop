import Operation from '../../../backend/Operation';
import * as tempFile from '../../utils/operations/tempFile';

const opn = new Operation();

opn.setDescription('sbatch direct: sbatch taking an input files as option');

opn.defineOptions({ script: 'SBATCH submission script (as string)' });

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  const script = opn.runOperation(tempFile, {
    content: opn.options.script,
  });
  // console.log(script);
  opn.addLog(script);

  return opn.runCommand(`sbatch -o $HOME/slurm-%j ${script}`);
}

opn.set(exec);

export default opn;
