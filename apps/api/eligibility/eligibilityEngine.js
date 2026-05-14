function isEligible(user, scheme) {

  const rules = scheme.eligibilityRules;

  if (
    rules.minAge &&
    user.age < rules.minAge
  ) {
    return false;
  }

  if (
    rules.maxIncome &&
    user.annualIncome > rules.maxIncome
  ) {
    return false;
  }

  if (
    rules.state &&
    rules.state !== user.state
  ) {
    return false;
  }

  if (
    rules.category &&
    rules.category !== user.category
  ) {
    return false;
  }

  return true;
}

function computeEligibleSchemes(
  user,
  schemes
) {
  return schemes.filter((scheme) =>
    isEligible(user, scheme)
  );
}

module.exports = {
  computeEligibleSchemes,
};
