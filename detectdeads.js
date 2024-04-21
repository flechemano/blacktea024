const { execSync } = require('child_process');

async function getDeprecatedPackages() {
  try {
    // Filter outdated packages with warnings (deprecated)
    const outdatedPackages = execSync('npm outdated --json -l warning', { encoding: 'utf8' });
    const parsedOutdatedPackages = JSON.parse(outdatedPackages);
    const deprecatedPackages = [];
    for (const packageName in parsedOutdatedPackages) {
      if (parsedOutdatedPackages[packageName].warnings && parsedOutdatedPackages[packageName].warnings.length > 0) {
        deprecatedPackages.push(packageName);
      }
    }
    return deprecatedPackages;
  } catch (error) {
    console.error(`Failed to get outdated packages. Error: ${error.message}`);
    return [];
  }
}

async function updatePackage(packageName) {
  try {
    console.log(`Updating package (if recommended): ${packageName}`);
    const outdatedInfo = execSync(`npm outdated --json ${packageName}`, { encoding: 'utf8' });
    const parsedInfo = JSON.parse(outdatedInfo);
    if (parsedInfo.warnings && parsedInfo.warnings.length > 0) {
      // Extract suggested replacement from warnings
      const suggestedReplacement = parsedInfo.warnings[0].message.match(/use (\S+) instead/); 
      if (suggestedReplacement) {
        console.log(`Updating to recommended package: ${suggestedReplacement[1]}`);
        execSync(`npm install ${suggestedReplacement[1]}`, { stdio: 'inherit' });
      } else {
        console.log(`No specific recommendation found for ${packageName}. Skipping update.`);
      }
    } else {
      console.log(`${packageName} is not deprecated. Skipping update.`);
    }
  } catch (error) {
    console.error(`Failed to update package ${packageName}. Error: ${error.message}`);
  }
}

async function updateDeprecatedPackages() {
  const deprecatedPackages = await getDeprecatedPackages();
  for (const packageName of deprecatedPackages) {
    await updatePackage(packageName);
  }
}

// Run the update process
updateDeprecatedPackages();

