import { app } from "../../../scripts/app.js";

console.log("[PromptSelectionCycle] loaded");

app.registerExtension({
  name: "PromptSelectionCycle",

  setup() {
    console.log("[PromptSelectionCycle] setup");

    let firstCtrlTime = 0;
    let firstCtrlTextarea = null;
    let phraseAnchor = null;

    const DOUBLE_CTRL_INTERVAL = 500;

    function isTextArea(target) {
      return target instanceof HTMLTextAreaElement;
    }

    function isDelimiter(char) {
      return (
        char === undefined ||
        char === " " ||
        char === "\t" ||
        char === "\r" ||
        char === "\n" ||
        char === ","
      );
    }

    function findWordRange(value, cursor) {
      let start = cursor;
      let end = cursor;

      while (start > 0 && !isDelimiter(value[start - 1])) {
        start--;
      }

      while (end < value.length && !isDelimiter(value[end])) {
        end++;
      }

      return { start, end };
    }

    function findPhraseRange(value, selectionStart, selectionEnd) {
      let start = selectionStart;
      let end = selectionEnd;

      while (
        start > 0 &&
        value[start - 1] !== "," &&
        value[start - 1] !== "\r" &&
        value[start - 1] !== "\n"
      ) {
        start--;
      }

      while (
        end < value.length &&
        value[end] !== "," &&
        value[end] !== "\r" &&
        value[end] !== "\n"
      ) {
        end++;
      }

      while (start < end && /\s/.test(value[start])) {
        start++;
      }

      while (end > start && /\s/.test(value[end - 1])) {
        end--;
      }

      return { start, end };
    }

    function handleKeyDown(event) {
      if (event.key !== "Control" && event.key !== "Meta") {
        return;
      }

      if (event.repeat) {
        return;
      }

      const target = document.activeElement;

      if (!isTextArea(target)) {
        return;
      }

      const now = performance.now();

      const isSecondCtrl =
        firstCtrlTextarea === target &&
        firstCtrlTime !== 0 &&
        now - firstCtrlTime <= DOUBLE_CTRL_INTERVAL;

      if (!isSecondCtrl) {
        firstCtrlTime = now;
        firstCtrlTextarea = target;

        console.log("[PromptSelectionCycle] first Ctrl");
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const value = target.value;
      const selectionStart = target.selectionStart;
      const selectionEnd = target.selectionEnd;
      const selectedPhrase = findPhraseRange(value, selectionStart, selectionEnd);
      const isPhraseSelected =
        selectionStart !== selectionEnd &&
        selectedPhrase.start === selectionStart &&
        selectedPhrase.end === selectionEnd;

      let start;
      let end;

      if (isPhraseSelected) {
        const cursor =
          phraseAnchor?.textarea === target &&
          phraseAnchor.start === selectedPhrase.start &&
          phraseAnchor.end === selectedPhrase.end
            ? phraseAnchor.cursor
            : selectionStart;
        const word = findWordRange(value, cursor);
        start = word.start;
        end = word.end;
        phraseAnchor = null;
      } else {
        const phrase = findPhraseRange(value, selectionStart, selectionEnd);
        const cursor =
          selectionStart === selectionEnd
            ? selectionStart
            : Math.floor((selectionStart + selectionEnd) / 2);
        phraseAnchor = {
          textarea: target,
          start: phrase.start,
          end: phrase.end,
          cursor
        };
        start = phrase.start;
        end = phrase.end;
      }

      selectRange(target, start, end);

      console.log("[PromptSelectionCycle] activated", {
        selectedText: value.substring(start, end),
        start,
        end
      });

      firstCtrlTime = 0;
      firstCtrlTextarea = null;
    }

    function selectRange(textarea, start, end) {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    }

    window.addEventListener("keydown", handleKeyDown, true);
  }
});
