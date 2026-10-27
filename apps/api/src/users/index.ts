// Публичный контракт модуля пользователей: остальные модули обращаются к нему
// только через CommandBus/QueryBus, используя эти команды и запросы.
export { CreateUserCommand } from './commands/create-user.command.js';
export { FindUserByEmailQuery } from './queries/find-user-by-email.query.js';
export { FindUserByIdQuery } from './queries/find-user-by-id.query.js';
export type { User } from './user.js';
export { UsersModule } from './users.module.js';
