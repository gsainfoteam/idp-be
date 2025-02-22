import { SetMetadata } from '@nestjs/common';

/** Loggable symbol for setting the metadata */
export const LOGGABLE = Symbol('LOGGABLE');
/** decorator to set the loggable metadata */
export const Loggable = () => SetMetadata(LOGGABLE, true);
