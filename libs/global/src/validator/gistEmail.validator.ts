import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function IsGistEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: GistEmailValidator,
    });
  };
}

@ValidatorConstraint()
export class GistEmailValidator implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    return value.endsWith('@gm.gist.ac.kr') || value.endsWith('@gist.ac.kr');
  }
}
