export const logger = {
  warn: (a,b) => {}
}

const BASE_LOGGER_MESSAGE = 'abc';

export function isInvalidValue(a: string, b: string) {
  let isInvalid = false;
  const megaInvalid = a === BASE_LOGGER_MESSAGE ? true : false;

  try {
    if (!a && !b) {
      console.log('invalid')
      isInvalid = true;
    } else {
      console.log('valid')
    }
  } catch (error) {
    console.error('error');
  }


  return megaInvalid && isInvalid;
}

export async function isInvalidValue2(a, b, {c = '33', d = '48'} : {c: string; d: string }, e, f) {
  let isInvalid = false;
  const megaInvalid = a === BASE_LOGGER_MESSAGE ? true : false;

  try {
    if (!a && !b) {
      console.log('invalid')
      isInvalid = true;
      if (a) {
        console.log('invalid/2')
      } else if (b) {
        console.log('invalid/2')
      }
    } else {
      console.log('valid')
    }
  } catch (error) {
    console.error('error');
  }


  return megaInvalid && isInvalid;
}

export const isInvalidValue3 = (a: string) => {
  let isInvalid = false;

  try {
    if (!a) {
      console.log('invalid')
      isInvalid = true;
    }
  } catch (error) {
    console.error('error');
  }


  return isInvalid;
}