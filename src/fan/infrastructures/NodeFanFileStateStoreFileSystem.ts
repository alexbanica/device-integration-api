import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { FanFileStateStoreFileSystemInterface } from './FanFileStateStoreFileSystemInterface';

export class NodeFanFileStateStoreFileSystem
  implements FanFileStateStoreFileSystemInterface
{
  public async mkdir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  public async readFile(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }

  public async writeFile(path: string, contents: string): Promise<void> {
    await writeFile(path, contents, 'utf8');
  }

  public async rename(from: string, to: string): Promise<void> {
    await rename(from, to);
  }
}
