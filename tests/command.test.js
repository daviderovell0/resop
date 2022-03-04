import * as path from 'path'
import { CommandParser } from "../src/backend/CommandParser";

const testCP = new CommandParser(path.join(__dirname, './commands.yml'))


describe('Command class tests', () => {
  it('should check if an option exists', () => {
    const command = testCP.getCommand('test')
    const option = 'option1'

    expect(command).not.toBe(null);
    expect(command.hasOption(option)).toBe(true);
    expect(command.hasOption(option+"doesntexists")).toBe(false);
  });

  it('should list all valid options', () => {
    const command = testCP.getCommand('test')
    const options = ['option1', 'option2']

    expect(command).not.toBe(null);
    expect(command.getOptions()).toEqual(options);
  });

  it('should generate the right command', () => {
    const command = testCP.getCommand('test')
    const user = {
      username: "anasmazouni"
    }
    const payload = {
      "input": "input",
      "option1": "value1",
      "option2": "value2"
    }
    const receivedCommand = command.generate(payload, user)
    const expectedCommand = "sudo runuser -l anasmazouni -c \"test -o1 value1 -o2 value2 input\""

    expect(receivedCommand).toEqual(expectedCommand);
  });

  it('should generate the right command and skip empty options', () => {
    const command = testCP.getCommand('test')
    const user = {
      username: "anasmazouni"
    }
    const payload = {
      "input": "input",
      "option1": "value1",
      "option2": ""
    }
    const receivedCommand = command.generate(payload, user)
    const expectedCommand = "sudo runuser -l anasmazouni -c \"test -o1 value1 input\""

    expect(receivedCommand).toEqual(expectedCommand);
  });

  it('should generate the right command and skip unknown options', () => {
    const command = testCP.getCommand('test')
    const user = {
      username: "anasmazouni"
    }
    const payload = {
      "input": "input",
      "option1": "value1",
      "option3": "value3"
    }
    const receivedCommand = command.generate(payload, user)
    const expectedCommand = "sudo runuser -l anasmazouni -c \"test -o1 value1 input\""

    expect(receivedCommand).toEqual(expectedCommand);
  });

  it('should generate the right command with temp files', () => {
    const command = testCP.getCommand('testwithfile')
    const user = {
      username: "anasmazouni"
    }
    const payload = {
      "input": "input",
      "option1": "value1",
      "option2": "value2"
    }

    const receivedCommand = command.generate(payload, user)
    const expectedCommand =/sudo runuser -l anasmazouni -c "printf 'input' > (.*) -o1 value1 -o2 value2 (.*)/

    expect(receivedCommand).toMatch(expectedCommand);
  });
});
