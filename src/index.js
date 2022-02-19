import path from "path";
import { bold } from "kleur";
import inquirer from "inquirer";
import { constants } from "fs";
import { paramCase, pascalCase } from "change-case";
import { writeFile, readFile, access } from "fs/promises";

import { getStoriesTitle, getTargetDir, createDir } from "./utils";

function populateOptions(options) {
  const { entity, name } = options;
  const pascalCaseName = pascalCase(name);

  options = {
    ...options,
    name: pascalCaseName,
    targetDir: getTargetDir(entity, paramCase(name)),
    storiesTitle: getStoriesTitle(entity, pascalCaseName),
  };

  return options;
}

async function promptAnswersToOptions() {
  const defaultName = "ExampleEntity";

  const questions = [];

  questions.push({
    type: "list",
    name: "entity",
    message: "Choose what entity want to create?",
    choices: ["component", "ui-component", "page", "widget"],
  });

  questions.push({
    type: "input",
    name: "name",
    message: `Enter entity name?`,
    default: defaultName,
  });

  questions.push({
    type: "checkbox",
    name: "files",
    message: "Choose which files should be created?",
    choices: [".vue", ".stories.js"],
    default: [".vue", ".stories.js"],
  });

  const answers = await inquirer.prompt(questions);

  return answers;
}

async function saveFilesToDisk(files, distPath, name, extentios) {
  files = files.map((file, index) => {
    const filename = path.resolve(distPath, name + extentios[index]);

    return { filename, data: file };
  });

  const needOverwrite = await overwriteFiles(files);

  if (needOverwrite) {
    await Promise.all(
      files.map(async ({ filename, data }) => {
        return writeFile(filename, data);
      })
    );
  }
}

async function overwriteFiles(files) {
  try {
    const existingFiles = await Promise.all(
      files.map(({ filename }) => access(filename, constants.F_OK))
    );

    if (existingFiles.length) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "Files exist, would you like to overwrite them?",
          default: false,
        },
      ]);

      return overwrite;
    }

    return true;
  } catch (error) {
    return true;
  }
}

async function createFiles(options) {
  await createDir(options);

  try {
    await access(options.targetDir, constants.R_OK);
  } catch (error) {
    process.exit(1);
  }

  const files = await Promise.all(
    options.files.map((ext) => {
      return createFile(options.name, options.storiesTitle, ext);
    })
  );

  await saveFilesToDisk(files, options.targetDir, options.name, options.files);
}

async function createFile(name, title, ext) {
  const currentFileUrl = import.meta.url;
  const tempaltePath = path.resolve(
    new URL(currentFileUrl).pathname,
    "../templates",
    ext
  );

  let file = await readFile(tempaltePath, { encoding: "utf-8" });

  file = file
    .replaceAll("ENTITY_NAME", name)
    .replaceAll("STORIES_TITLE", title);

  return file;
}

export async function cli() {
  let options = await promptAnswersToOptions();
  options = populateOptions(options);

  await createFiles(options);

  console.log(bold().green("Done!"));
}
