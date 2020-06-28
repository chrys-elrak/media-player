import { Pipe, PipeTransform } from '@angular/core';
import * as path from 'path';
@Pipe({
  name: 'extractFilename'
})
export class ExtractFilenamePipe implements PipeTransform {

  transform(value: string): string {
    return path.basename(value);
  }

}
