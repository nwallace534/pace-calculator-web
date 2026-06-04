const endsWithSkipChar = (value: string) => {
  let skipCharacterFound = false;

  if (value && value.length > 0) {
    const lastChar = value.charAt(value.length - 1);

    if (
      lastChar === "." ||
      lastChar === ":" ||
      lastChar === "-" ||
      lastChar === "," ||
      lastChar === "#" ||
      lastChar === "*"
    ) {
      skipCharacterFound = true;
    }
  }

  return skipCharacterFound;
};

export default endsWithSkipChar;
