import { writeFile, readFile, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { promisify } from 'util';
import { List, Task } from '../models';
import { logger } from '../utils/logger';

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

/**
 * Interface for file storage data structure
 */
interface FileStorageData {
  lists: Record<string, List>;
  tasks: Record<string, Task>;
  metadata: {
    version: string;
    exportedAt: string;
    itemCount: {
      lists: number;
      tasks: number;
    };
  };
}

/**
 * File storage utility for optional data persistence
 */
export class FileStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.ensureDirectoryExists();
  }

  /**
   * Save data to JSON file
   */
  async saveToFile(lists: Map<string, List>, tasks: Map<string, Task>): Promise<void> {
    try {
      const data: FileStorageData = {
        lists: Object.fromEntries(lists),
        tasks: Object.fromEntries(tasks),
        metadata: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          itemCount: {
            lists: lists.size,
            tasks: tasks.size,
          },
        },
      };

      const jsonData = JSON.stringify(data, this.dateReplacer, 2);
      await writeFileAsync(this.filePath, jsonData, 'utf8');

      logger.info('Data saved to file', {
        filePath: this.filePath,
        listsCount: lists.size,
        tasksCount: tasks.size,
      });
    } catch (error) {
      logger.error('Failed to save data to file', {
        filePath: this.filePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Load data from JSON file
   */
  async loadFromFile(): Promise<{ lists: Map<string, List>; tasks: Map<string, Task> }> {
    try {
      if (!existsSync(this.filePath)) {
        logger.info('No existing data file found, starting with empty storage', {
          filePath: this.filePath,
        });
        return {
          lists: new Map(),
          tasks: new Map(),
        };
      }

      const jsonData = await readFileAsync(this.filePath, 'utf8');
      const data: FileStorageData = JSON.parse(jsonData, this.dateReviver);

      const lists = new Map(Object.entries(data.lists));
      const tasks = new Map(Object.entries(data.tasks));

      logger.info('Data loaded from file', {
        filePath: this.filePath,
        listsCount: lists.size,
        tasksCount: tasks.size,
        version: data.metadata?.version,
        exportedAt: data.metadata?.exportedAt,
      });

      return { lists, tasks };
    } catch (error) {
      logger.error('Failed to load data from file', {
        filePath: this.filePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export data to a specific file (for backups)
   */
  async exportToFile(
    lists: Map<string, List>,
    tasks: Map<string, Task>,
    exportPath: string
  ): Promise<void> {
    const tempFilePath = this.filePath;
    this.filePath = exportPath;
    this.ensureDirectoryExists();
    
    try {
      await this.saveToFile(lists, tasks);
      logger.info('Data exported successfully', {
        exportPath,
        listsCount: lists.size,
        tasksCount: tasks.size,
      });
    } finally {
      this.filePath = tempFilePath;
    }
  }

  /**
   * Check if file exists
   */
  fileExists(): boolean {
    return existsSync(this.filePath);
  }

  /**
   * Get file path
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Create backup of current file
   */
  async createBackup(): Promise<string> {
    if (!this.fileExists()) {
      throw new Error('No data file exists to backup');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.filePath.replace('.json', `-backup-${timestamp}.json`);

    try {
      const data = await readFileAsync(this.filePath, 'utf8');
      await writeFileAsync(backupPath, data, 'utf8');

      logger.info('Backup created successfully', {
        originalPath: this.filePath,
        backupPath,
      });

      return backupPath;
    } catch (error) {
      logger.error('Failed to create backup', {
        originalPath: this.filePath,
        backupPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate file structure
   */
  async validateFile(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      if (!this.fileExists()) {
        errors.push('File does not exist');
        return { valid: false, errors };
      }

      const jsonData = await readFileAsync(this.filePath, 'utf8');
      const data = JSON.parse(jsonData);

      // Check required properties
      if (!data.lists) errors.push('Missing lists property');
      if (!data.tasks) errors.push('Missing tasks property');
      if (!data.metadata) errors.push('Missing metadata property');

      // Validate data types
      if (data.lists && typeof data.lists !== 'object') {
        errors.push('Lists property must be an object');
      }
      if (data.tasks && typeof data.tasks !== 'object') {
        errors.push('Tasks property must be an object');
      }

      // Validate list structure
      if (data.lists) {
        for (const [id, list] of Object.entries(data.lists)) {
          if (typeof list !== 'object' || !list) {
            errors.push(`Invalid list structure for ID: ${id}`);
            continue;
          }
          const listObj = list as any;
          if (!listObj.id || !listObj.name) {
            errors.push(`List ${id} missing required fields (id, name)`);
          }
        }
      }

      // Validate task structure
      if (data.tasks) {
        for (const [id, task] of Object.entries(data.tasks)) {
          if (typeof task !== 'object' || !task) {
            errors.push(`Invalid task structure for ID: ${id}`);
            continue;
          }
          const taskObj = task as any;
          if (!taskObj.id || !taskObj.list_id || !taskObj.title) {
            errors.push(`Task ${id} missing required fields (id, list_id, title)`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Ensure the directory exists for the file path
   */
  private ensureDirectoryExists(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.debug('Created directory for file storage', { directory: dir });
    }
  }

  /**
   * JSON replacer function to handle Date objects
   */
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __date: value.toISOString() };
    }
    return value;
  }

  /**
   * JSON reviver function to restore Date objects
   */
  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__date) {
      return new Date(value.__date);
    }
    return value;
  }
}

/**
 * Create file store instance from environment configuration
 */
export const createFileStore = (filePath?: string): FileStore | null => {
  const path = filePath || process.env.PERSISTENCE_FILE_PATH;
  
  if (!path) {
    logger.info('No file persistence path configured');
    return null;
  }

  return new FileStore(path);
};

export default FileStore;
