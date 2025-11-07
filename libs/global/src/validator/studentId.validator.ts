import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
export class StudentIdValidator implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    return /^[0-9]{8}$/.test(value) || /^[0-9]{5}$/.test(value);
  }
}
