import {BaseModule} from 'dok-ts/base/BaseModule';
import * as path from 'path';
import {getApplication} from 'dok-ts';

export class MigrateModule extends BaseModule {
  public static options = {
    basePath: __dirname,
    databaseName: 'db',
    migrationDirName: 'migrations',
    controller: {
      ext: '.js'
    }
  };
  public readonly id = 'MigrateModule';

  getMigrationPath() {
    return path.join(getApplication().getPath(), this.config.migrationDirName);
  }
}
