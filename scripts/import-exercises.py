#!/usr/bin/env python3
"""Pair textbook exercise prompts from the PDF with solutions from the HTML manual."""

from __future__ import annotations

import html as html_stdlib
import json
import re
from bisect import bisect_right
from pathlib import Path

from lxml import etree, html
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "private-source" / "exercises.pdf"
HTML_PATH = ROOT / "private-source" / "exercise-solutions-4ed.html"
OUTPUT_PATH = ROOT / "data" / "exercises.js"


CHAPTERS = [
    {"html_id": "ch01", "id": "chapter-1", "number": 1, "label": "Chapter 1", "title": "Introduction to Java Programming", "topic": "Fundamentals", "start": 1, "end": 6},
    {"html_id": "ch02", "id": "chapter-2", "number": 2, "label": "Chapter 2", "title": "Primitive Data and Definite Loops", "topic": "Loops", "start": 7, "end": 12},
    {"html_id": "ch03", "id": "chapter-3", "number": 3, "label": "Chapter 3", "title": "Parameters and Objects", "topic": "Methods & Strings", "start": 13, "end": 19},
    {"html_id": "ch03g", "id": "supplement-3g", "number": 3.5, "label": "Supplement 3G", "title": "Graphics", "topic": "Graphics", "start": 20, "end": 32},
    {"html_id": "ch04", "id": "chapter-4", "number": 4, "label": "Chapter 4", "title": "Conditional Execution", "topic": "Conditionals", "start": 33, "end": 39},
    {"html_id": "ch05", "id": "chapter-5", "number": 5, "label": "Chapter 5", "title": "Program Logic and Indefinite Loops", "topic": "While Loops", "start": 40, "end": 46},
    {"html_id": "ch06", "id": "chapter-6", "number": 6, "label": "Chapter 6", "title": "File Processing", "topic": "File I/O", "start": 47, "end": 54},
    {"html_id": "ch07", "id": "chapter-7", "number": 7, "label": "Chapter 7", "title": "Arrays", "topic": "Arrays", "start": 55, "end": 60},
    {"html_id": "ch08", "id": "chapter-8", "number": 8, "label": "Chapter 8", "title": "Classes", "topic": "Classes & Objects", "start": 61, "end": 67},
    {"html_id": "ch09", "id": "chapter-9", "number": 9, "label": "Chapter 9", "title": "Inheritance and Interfaces", "topic": "Inheritance", "start": 68, "end": 74},
    {"html_id": "ch10", "id": "chapter-10", "number": 10, "label": "Chapter 10", "title": "ArrayLists", "topic": "ArrayLists", "start": 75, "end": 79},
    {"html_id": "ch11", "id": "chapter-11", "number": 11, "label": "Chapter 11", "title": "The Java Collections Framework", "topic": "Collections", "start": 80, "end": 84},
    {"html_id": "ch12", "id": "chapter-12", "number": 12, "label": "Chapter 12", "title": "Recursion", "topic": "Recursion", "start": 85, "end": 93},
    {"html_id": "ch13", "id": "chapter-13", "number": 13, "label": "Chapter 13", "title": "Searching and Sorting", "topic": "Searching & Sorting", "start": 94, "end": 98},
    {"html_id": "ch14", "id": "chapter-14", "number": 14, "label": "Chapter 14", "title": "Stacks and Queues", "topic": "Stacks & Queues", "start": 99, "end": 105},
    {"html_id": "ch15", "id": "chapter-15", "number": 15, "label": "Chapter 15", "title": "Implementing Collection Classes", "topic": "Collection Classes", "start": 106, "end": 110},
    {"html_id": "ch16", "id": "chapter-16", "number": 16, "label": "Chapter 16", "title": "Linked Lists", "topic": "Linked Lists", "start": 111, "end": 115},
    {"html_id": "ch17", "id": "chapter-17", "number": 17, "label": "Chapter 17", "title": "Binary Trees", "topic": "Binary Trees", "start": 116, "end": 122},
    {"html_id": "ch18", "id": "chapter-18", "number": 18, "label": "Chapter 18", "title": "Advanced Data Structures", "topic": "Advanced Data Structures", "start": 123, "end": 127},
    {"html_id": "ch19", "id": "chapter-19", "number": 19, "label": "Chapter 19", "title": "Functional Programming with Lambdas", "topic": "Functional Programming", "start": 128, "end": 129},
]

# The HTML contains online-only solutions that are not present in the supplied PDF.
UNMATCHED_SOLUTION_NUMBERS = {
    "ch03": {23},
    "ch04": {18},
    "ch07": {22, 23, 24, 25},
}

ALLOWED_TAGS = {"pre", "p", "div", "br", "sup", "sub", "em", "strong", "b", "i", "ul", "ol", "li", "code", "hr"}


def clean_prompt(value: str) -> str:
    value = value.replace("\u00a0", " ").replace("\r", "")
    value = re.sub(r"([A-Za-z])-\n\s*([a-z])", r"\1-\2", value)
    lines = [line.rstrip() for line in value.splitlines()]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    value = "\n".join(lines)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def extract_prompts(reader: PdfReader, chapter: dict) -> list[dict]:
    combined = ""
    page_offsets = []
    for page_number in range(chapter["start"], chapter["end"] + 1):
        text = reader.pages[page_number - 1].extract_text(extraction_mode="layout") or ""
        if combined:
            combined += "\n"
        page_offsets.append((len(combined), page_number))
        combined += text
    text = combined
    text = text.split("Programming Projects", 1)[0]
    markers = list(re.finditer(r"^ {0,2}(\d+)\.\s", text, re.MULTILINE))
    prompts = []
    numbers = []
    for index, marker in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        numbers.append(int(marker.group(1)))
        offset_index = bisect_right([offset for offset, _ in page_offsets], marker.start()) - 1
        prompts.append({
            "text": clean_prompt(text[marker.end():end]),
            "page": page_offsets[max(offset_index, 0)][1],
        })
    expected_numbers = list(range(1, len(prompts) + 1))
    if numbers != expected_numbers:
        raise ValueError(f"Non-sequential exercise numbers for {chapter['html_id']}: {numbers}")
    return prompts


def section_html(raw: str, section_id: str) -> str:
    start_match = re.search(rf'<h2 id="{re.escape(section_id)}">', raw)
    if not start_match:
        raise ValueError(f"Missing solution section {section_id}")
    next_match = re.search(r'<h2 id="', raw[start_match.end():])
    end = start_match.end() + next_match.start() if next_match else len(raw)
    return raw[start_match.start():end]


def parse_chapter_17_items(raw: str) -> list[etree._Element]:
    section = section_html(raw, "ch17")
    markers = list(re.finditer(r"^\t\t\t<li>\s*$", section, re.MULTILINE))
    items = []
    for index, marker in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(section)
        fragment = html.fragment_fromstring(section[marker.start():end], create_parent="div")
        candidates = fragment.xpath("./li")
        if candidates:
            items.append(candidates[0])
    if len(items) != 20:
        raise ValueError(f"Expected 20 Chapter 17 solutions, found {len(items)}")
    return items


def sanitize_element(element: etree._Element) -> None:
    for child in list(element.iterdescendants()):
        if not isinstance(child.tag, str):
            continue
        tag = child.tag.lower()
        if tag not in ALLOWED_TAGS:
            child.drop_tag()
            continue
        child.attrib.clear()
        if tag == "pre":
            child.set("class", "java")


def inner_html(element: etree._Element) -> str:
    sanitize_element(element)
    pieces = []
    if element.text and element.text.strip():
        pieces.append(html_stdlib.escape(element.text))
    for child in element:
        pieces.append(etree.tostring(child, encoding="unicode", method="html"))
    return "".join(pieces).strip()


def item_variants(item: etree._Element) -> list[dict]:
    variants = item.xpath("./ul/li") or [item]
    output = []
    for variant in variants:
        rendered = inner_html(variant)
        text = clean_prompt("\n".join(part.strip() for part in variant.itertext() if part.strip()))
        if rendered or text:
            output.append({"html": rendered, "text": text})
    return output


def extract_solution_items(document: etree._Element, raw: str, section_id: str) -> list[etree._Element]:
    if section_id == "ch17":
        return parse_chapter_17_items(raw)
    headings = document.xpath(f'//h2[@id="{section_id}"]')
    if not headings:
        raise ValueError(f"Missing solution heading {section_id}")
    lists = headings[0].xpath("following-sibling::ol[1]")
    if not lists:
        raise ValueError(f"Missing solution list {section_id}")
    return lists[0].xpath("./li")


def exercise_name(prompt: str, solution_text: str) -> str:
    prompt_patterns = [
        r"\b(?:method|program|class)\s+(?:called|named)\s+([A-Za-z_$][\w$]*)",
        r"\b(?:Write|Add|Implement|Modify|Create|Define)\s+(?:a|the)?\s*(?:static\s+)?method\s+(?:called\s+)?([A-Za-z_$][\w$]*)",
        r"\b(?:Write|Create|Define|Implement)\s+(?:a|the)?\s*(?:public\s+)?class\s+([A-Za-z_$][\w$]*)",
    ]
    for pattern in prompt_patterns:
        match = re.search(pattern, prompt, re.IGNORECASE)
        if match:
            return match.group(1)
    class_match = re.search(r"\bpublic\s+class\s+([A-Za-z_$][\w$]*)", solution_text)
    if class_match:
        return class_match.group(1)
    method_matches = re.findall(
        r"\bpublic\s+(?:static\s+)?(?:<[^>]+>\s+)?[\w<>\[\], ?]+\s+([A-Za-z_$][\w$]*)\s*\(",
        solution_text,
    )
    for method_name in method_matches:
        if method_name != "main":
            return method_name
    return ""


def build_dataset() -> list[dict]:
    reader = PdfReader(str(PDF_PATH))
    raw_html = HTML_PATH.read_text(encoding="utf-8", errors="replace")
    document = html.fromstring(raw_html)
    exercises = []

    for chapter in CHAPTERS:
        prompts = extract_prompts(reader, chapter)
        solution_items = extract_solution_items(document, raw_html, chapter["html_id"])
        excluded = UNMATCHED_SOLUTION_NUMBERS.get(chapter["html_id"], set())
        solution_items = [item for number, item in enumerate(solution_items, 1) if number not in excluded]

        if len(prompts) != len(solution_items):
            raise ValueError(
                f"Pairing mismatch for {chapter['html_id']}: "
                f"{len(prompts)} prompts and {len(solution_items)} solutions"
            )

        for exercise_number, (prompt_data, solution_item) in enumerate(zip(prompts, solution_items), 1):
            prompt = prompt_data["text"]
            variants = item_variants(solution_item)
            solution_text = "\n\n".join(variant["text"] for variant in variants)
            name = exercise_name(prompt, solution_text)
            chapter_code = chapter["label"].replace("Chapter ", "").replace("Supplement ", "")
            display_number = f"{chapter_code}.{exercise_number}"
            title = f"Exercise {display_number}"
            if name:
                title += f" · {name}"
            exercises.append({
                "id": f"exercise-{chapter['id']}-{exercise_number}",
                "number": exercise_number,
                "displayNumber": display_number,
                "title": title,
                "name": name,
                "chapterId": chapter["id"],
                "chapterNumber": chapter["number"],
                "chapter": chapter["label"],
                "chapterTitle": chapter["title"],
                "topic": chapter["topic"],
                "prompt": prompt,
                "pdfPage": prompt_data["page"],
                "hasFigureReference": bool(re.search(r"\b(?:Figure|reference (?:tree|binary tree)|following (?:image|figure|diagram))\b", prompt, re.IGNORECASE)),
                "solutionVariants": variants,
                "solutionText": solution_text,
                "pdfPageRange": f"{chapter['start']}-{chapter['end']}",
            })

    if len(exercises) != 390:
        raise ValueError(f"Expected 390 paired exercises, found {len(exercises)}")
    return exercises


def main() -> None:
    exercises = build_dataset()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = "window.JAVA_EXERCISES = " + json.dumps(exercises, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT_PATH.write_text(payload, encoding="utf-8")
    variants = sum(len(exercise["solutionVariants"]) for exercise in exercises)
    print(f"Generated {len(exercises)} paired exercises with {variants} solution variants.")


if __name__ == "__main__":
    main()
