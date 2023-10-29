//@ts-check

const keyArr = [];
const valueArr = [];
const tabArr = [];
const liHeight = 20;
const spanTabSize = 20;
let firstLineIndex = 0;
let linesPerPage = Math.ceil(window.innerHeight / liHeight) + 1;

const jsonLines = document.createElement("ul");
const jsonSection = document.createElement("div");
const jsonTitle = document.createElement("h2");

const body = document.body;
const main = document.createElement("main");
const section = document.createElement("section");
const h1 = document.createElement("h1");
const h2 = document.createElement("h2");

const button = document.createElement("button");
const input = document.createElement("input");
const p = document.createElement("p");

const h1Text = document.createTextNode("JSON Tree Viewer");
h1.appendChild(h1Text);

const h2Text = document.createTextNode(
  "Simple JSON Viewer that runs completely on-client. No data exchange"
);
h2.appendChild(h2Text);

const buttonText = document.createTextNode("Load JSON");
button.appendChild(buttonText);
button.addEventListener("click", () => {
  input.click();
});

input.type = "file";
input.accept = "application/json";
input.style.display = "none";
input.addEventListener(
  "change",
  () => handleFile((input.files || [])[0]),
  false
);

const pText = document.createTextNode(
  "Invalid file. Please load a valid JSON file."
);
p.style.display = "none";
p.appendChild(pText);

section.appendChild(h1);
section.appendChild(h2);
section.appendChild(button);
section.appendChild(input);
section.appendChild(p);

jsonSection.appendChild(jsonTitle);
jsonSection.appendChild(jsonLines);
jsonSection.style.display = "none";

main.appendChild(section);
main.appendChild(jsonSection);

body.appendChild(main);

/**
 *
 * @param {File | undefined} file
 */
function handleFile(file) {
  if (!file) return;
  p.style.display = "none";
  extractJson(file)
    .then((json) => extractJsonLines(json, 0))
    .then(() => {
      section.style.display = "none";
      jsonTitle.innerText = file.name;
      jsonSection.style.display = "block";
      jsonSection.style.height = `${(keyArr.length + 2) * liHeight}px`;
      fullRender();
    })
    .catch((err) => {
      p.style.display = "block";
    });
}

/**
 *
 * @param {File} file
 * @returns {Promise<Object>}
 */
async function extractJson(file) {
  return JSON.parse(await file.text());
}

/**
 *
 * @param {Object} json
 * @param {number} numberOfTabs
 */
function extractJsonLines(json, numberOfTabs) {
  if (Array.isArray(json)) {
    keyArr.push(0);
    valueArr.push("[");
    tabArr.push(numberOfTabs);
    numberOfTabs += 1;
  }
  /**
   *
   * @param {Object} json
   * @param {number} numberOfTabs
   */
  function moreLines(json, numberOfTabs) {
    for (let key in json) {
      const value = json[key];
      if (typeof value !== "object" || value === null) {
        keyArr.push(key);
        valueArr.push(value);
        tabArr.push(numberOfTabs);
      } else {
        keyArr.push(key);
        valueArr.push(Array.isArray(value) ? "[" : undefined);
        tabArr.push(numberOfTabs);
        moreLines(value, numberOfTabs + 1);
        if (Array.isArray(value)) {
          keyArr.push(undefined);
          valueArr.push("]");
          tabArr.push(numberOfTabs);
        }
      }
    }
  }
  moreLines(json, numberOfTabs);
  if (Array.isArray(json)) {
    keyArr.push(undefined);
    valueArr.push("]");
    numberOfTabs -= 1;
    tabArr.push(numberOfTabs);
  }
}

/**
 *
 * @param {number} line
 * @returns {HTMLLIElement}
 */
function createLine(line) {
  const [key, value, tab] = [keyArr[line], valueArr[line], tabArr[line]];
  const li = document.createElement("li");
  spanLeftSpaces(li, tab);
  const span = document.createElement("span");
  span.style.left = `${tab * spanTabSize}px`;
  if (key !== undefined) {
    const isArray = !isNaN(Number(key));
    const lSpan = document.createElement("span");
    lSpan.className = isArray ? "index_span" : "key_span";
    lSpan.innerText = key;
    span.appendChild(lSpan);

    const mSpan = document.createElement("span");
    mSpan.className = isArray ? "index_span colon_span" : "key_span colon_span";
    mSpan.innerText = ":";
    span.appendChild(mSpan);
  }
  if (value !== undefined) {
    const rSpan = document.createElement("span");
    if (value === "[" || value === "]") {
      rSpan.className = "bracket_span";
      rSpan.innerText = value;
    } else {
      rSpan.innerText = typeof value === "string" ? `"${value}"` : value;
    }
    span.appendChild(rSpan);
  }
  li.appendChild(span);
  return li;
}

/**
 *
 * @param {HTMLLIElement} li
 * @param {number} leftSize
 */
function spanLeftSpaces(li, leftSize) {
  for (let i = 0; i < leftSize; i++) {
    const span = document.createElement("span");
    span.className = "span_space";
    span.style.left = `${i * spanTabSize}px`;
    li.appendChild(span);
  }
}

window.onscroll = () => {
  renderCheck();
};

window.onresize = () => {
  linesPerPage = Math.ceil(window.innerHeight / liHeight) + 1;
  if (!jsonLines.hasChildNodes()) return;
  if (jsonLines.children.length > linesPerPage) {
    while (jsonLines.children.length > linesPerPage) {
      jsonLines.lastChild?.remove();
    }
  }
  if (jsonLines.children.length < linesPerPage) {
    const end = firstLineIndex + linesPerPage;
    const start = jsonLines.children.length + firstLineIndex;
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      fragment.appendChild(createLine(i));
    }
    jsonLines.appendChild(fragment);
  }
};

function renderCheck() {
  const currIndex = Math.max(
    Math.floor((document.documentElement.scrollTop - jsonLines.offsetTop) / 20),
    0
  );
  if (currIndex === firstLineIndex) return;
  if (Math.abs(currIndex - firstLineIndex) > linesPerPage) {
    jsonLines.innerHTML = "";
    firstLineIndex = currIndex;
    fullRender();
  } else {
    if (firstLineIndex < currIndex) {
      const end =
        currIndex + linesPerPage > keyArr.length
          ? keyArr.length - linesPerPage
          : currIndex;
      for (let i = firstLineIndex; i < end; i++) {
        jsonLines.appendChild(createLine(i + linesPerPage));
        jsonLines.removeChild(jsonLines.children[0]);
      }
      jsonLines.style.transform = `translateY(${end * 20}px)`;
      firstLineIndex = end;
    }
    if (firstLineIndex > currIndex) {
      for (let i = firstLineIndex - 1; i >= currIndex; i--) {
        jsonLines.insertBefore(createLine(i), jsonLines.children[0]);
        jsonLines.lastChild?.remove();
      }
      jsonLines.style.transform = `translateY(${currIndex * 20}px)`;
      firstLineIndex = currIndex;
    }
  }
}

function fullRender() {
  const fragment = document.createDocumentFragment();
  for (let i = firstLineIndex; i < linesPerPage + firstLineIndex; i++) {
    fragment.appendChild(createLine(i));
  }
  jsonLines.appendChild(fragment);
  jsonLines.style.transform = `translateY(${firstLineIndex * 20}px)`;
}
