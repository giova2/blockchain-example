import { v1 as uuidv1 } from 'uuid';

export const createId = () => uuidv1().split('-').join('');