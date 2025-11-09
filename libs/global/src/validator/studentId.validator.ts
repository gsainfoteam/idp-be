import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function IsStudentId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: StudentIdValidator,
    });
  };
}

@ValidatorConstraint()
export class StudentIdValidator implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    return /^[0-9]{8}$/.test(value) || /^[0-9]{5}$/.test(value);
  }
}
