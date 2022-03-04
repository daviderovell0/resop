import {
  CommandParser
} from "../src/backend/CommandParser";
import Command from "../src/backend/Command";


describe('CommandParser class tests', () => {
  it('should parse all the valid commands', () => {
    const testCP = new CommandParser()
    const commands = testCP.getCommands()
    const commandNames = commands.map(command => command.command)
    expect(commands.length).toEqual(10);
    expect(commandNames).toEqual(['sacct', 'srun', 'sbatch', 'sbatch2', "sbcast",
      "scancel",
      "salloc",
      "squeue",
      "scontrol",
      "sinfo"
    ]);
  });

  it('should find a valid command', () => {
    const testCP = new CommandParser()
    const command = testCP.getCommand('sacct')
    expect(command).not.toBe(null);
    expect(command).toBeInstanceOf(Command)
  });

  it('should return null for unknown commands', () => {
    const testCP = new CommandParser()
    const command = testCP.getCommand('thiscommanddoesntexists')
    expect(command).toBe(null);
  });
});