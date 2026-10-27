import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // Дата обязана содержать часовой пояс (Z или ±hh:mm), иначе момент времени неоднозначен.
  @IsString()
  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:?\d{2})$/i, {
    message: 'date must include a timezone offset',
  })
  date: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsEmail({}, { each: true })
  participants: string[];
}
