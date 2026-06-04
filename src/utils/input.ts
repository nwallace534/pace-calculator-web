export const getValidatedInput = (
  inputValue: string,
  maxNumber: number,
  padZeroLength: number,
) => {
  let value = inputValue;

  value = value.replace(/'/g, "");
  value = value.replace(/:/g, "");
  value = value.replace(/\./g, "");

  const numericValue = getNumericValue(value);

  value = numericValue.toString();

  if (maxNumber > 0) {
    if (numericValue > maxNumber) {
      value = maxNumber.toString();
    }
  }

  if (padZeroLength > value.length) {
    value = value.padStart(padZeroLength, "0");
  }

  return value;
};

export const getNumericValue = (value: string) => {
  if (value && value.length > 0) {
    const intValue = Number(value);

    if (!Number.isNaN(intValue)) {
      return intValue;
    }
  }
  return 0;
};

export const getDecimalValue = (value: string) => {
  if (value && value.length > 0) {
    const decimalValue = Number.parseFloat(`0.${value.toString()}`);

    if (!Number.isNaN(decimalValue)) {
      return decimalValue;
    }
  }
  return 0;
};
