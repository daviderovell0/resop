import bcrypt from 'bcryptjs';

const user = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        isLowercase: true,
        validate: {
          is: {
            args: [
              /^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/i,
            ], // regex for username standard
            msg: ` Username must be between 3 and 20 characters\n
             Username must only contain alphanumeric characters, underscore and dot.\n
             Underscore and dot can not be concatenated or at the start or end of the username\n`,
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [5, 30],
        },
      },
      mail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [5, 70],
        },
      },
    },
    {
      // sequlize hooks in the option section:
      // define(modelName: string, attributes: Object, >options: Object< )
      hooks: {
        beforeSave: async (userInstance) => {
          // encrypt the password before saving it to database
          const salt = await bcrypt.genSalt();
          // eslint-disable-next-line no-param-reassign
          userInstance.password = await bcrypt.hash(
            userInstance.password,
            salt
          );
        },
      },
    }
  );
  return User;
};

export default user;
