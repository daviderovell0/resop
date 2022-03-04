import Sequelize from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.DB_PWD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mariadb',
  }
);

export default sequelize;
export const User = import('./user');
