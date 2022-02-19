import path from "path";
import { bold } from "kleur";
import inquirer from "inquirer";
import { constants } from "fs";
import { paramCase, pascalCase } from "change-case";
import { writeFile, readFile, access } from "fs/promises";

import { getStoriesTitle, getTargetDir, createDir } from "./utils";

const ENTITY_PAGE = "page";
const ENTITY_WIDGET = "widget";
const ENTITY_UI = "ui-component";
const ENTITY_COMPONENT = "component";

const EXT_VUE = ".vue";
const EXT_JS = ".js";
const EXT_STORIES = ".stories.js";

function isEntryPoint(entity) {
  return [ENTITY_PAGE, ENTITY_WIDGET].includes(entity);
}

function populateOptions(options) {
  const { entity, name, extensions } = options;
  const pascalCaseName = pascalCase(name);

  options = {
    ...options,
    name: pascalCaseName,
    targetDir: getTargetDir(entity, paramCase(name)),
    storiesTitle: getStoriesTitle(entity, pascalCaseName),
    files: extensions.map((ext) => pascalCaseName + ext),
  };

  if (isEntryPoint(entity) && extensions.includes(EXT_VUE)) {
    options.extensions.push(EXT_JS);
    options.files.push("index" + EXT_JS);
  }

  return options;
}

async function promptAnswersToOptions() {
  const defaultName = "ExampleEntity";

  const questions = [];

  questions.push({
    type: "list",
    name: "entity",
    message: "Choose what entity want to create?",
    choices: [ENTITY_COMPONENT, ENTITY_UI, ENTITY_PAGE, ENTITY_WIDGET],
  });

  questions.push({
    type: "input",
    name: "name",
    message: `Enter entity name?`,
    default: defaultName,
  });

  questions.push({
    type: "checkbox",
    name: "extensions",
    message: "Choose which files should be created?",
    choices: [EXT_VUE, EXT_STORIES],
    default: [EXT_VUE, EXT_STORIES],
  });

  const answers = await inquirer.prompt(questions);

  return answers;
}

async function saveFilesToDisk(files, distPath, fileNames) {
  files = files.map((file, index) => {
    const filename = path.resolve(distPath, fileNames[index]);
    console.log(filename);
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
    options.extensions.map((ext) => {
      return createFile(options.name, options.storiesTitle, ext);
    })
  );

  await saveFilesToDisk(files, options.targetDir, options.files);
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
