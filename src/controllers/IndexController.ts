import {ConsoleController} from 'dok-ts/console/ConsoleController';
import {getApplication} from 'dok-ts';
import * as path from 'path';
import * as fs from 'fs';
import {MigrateModule} from '../MigrateModule';
import {LOG_LEVEL} from 'dok-ts/services/LoggerService';

const MIGRATION_TEMPLATE = `export async function up(){
  return false;
}
export async function down(){
  return false;
}`;

export class IndexController extends ConsoleController {
  public module: MigrateModule;

  getMigrationLockFIlePath() {
    return path.join(this.module.getMigrationPath(), 'migrations.json');
  }

  constructor(private logService) {
    super();
    if (!fs.existsSync(this.module.getMigrationPath())) {
      fs.mkdirSync(this.module.getMigrationPath());
    }

    const jsonPath = this.getMigrationLockFIlePath();

    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, '[]');
    }
  }

  createAction() {
    const name = getApplication().arguments.name || '';
    const time = (new Date()).getTime();
    const ext = this.module.config.controller.ext;
    const migrationPath = path.join(this.module.getMigrationPath(), time + '' + name + ext);

    fs.writeFileSync(migrationPath, MIGRATION_TEMPLATE);

    return this.render(200, `Created ${migrationPath}`, {});
  }

  async upAction() {
    const regexp = new RegExp(`.${this.module.config.controller.ext}`);
    const migrationsList = JSON.parse(fs.readFileSync(this.getMigrationLockFIlePath(), 'utf8'));
    const files = fs.readdirSync(this.module.getMigrationPath())
      .filter((file) => !!file.match(regexp) && migrationsList.indexOf(`${file}`) === -1);

    for (let q = 0; q < files.length; q++) {
      const file = files[q];
      migrationsList.push(`${file}`);
      const migration = require(path.join(this.module.getMigrationPath(), file));
      this.logService.render(LOG_LEVEL.INFO, 'Run migrate ' + file);
      if (await migration.up()) {
        this.logService.render(LOG_LEVEL.INFO, 'Migrate is up: ' + file);
        migrationsList.push(file);
      }
    }

    if (!files.length) {
      return this.render(200, 'There are no new migrations', {});
    }

    fs.writeFileSync(this.getMigrationLockFIlePath(), JSON.stringify(migrationsList));

    return this.render(200, 'All migrations completed', {});
  }

  async downAction() {
    const migrationsList = JSON.parse(fs.readFileSync(this.getMigrationLockFIlePath(), 'utf8'));
    const name = migrationsList.pop();
    const migration = require(path.join(this.module.getMigrationPath(), name));

    if (await migration.down()) {
      this.logService.render(LOG_LEVEL.INFO, 'Migrate is down: ' + name);
    }

    return this.render(200, `Migration down completed`, {});
  }
}