import { describe, expect, it } from "vitest";

import {
  containsPattern,
  DEFAULT_QUERY,
  nextSort,
  pageCount,
  pageNumbers,
  parseQuery,
  problemOf,
  queryString,
  rangeLabel,
  searchText,
} from "./rules";

describe("the view in the address", () => {
  it("reads the search, the filter, the sort and the page", () => {
    expect(parseQuery({ q: "devis", type: "image", sort: "date-asc", page: "3" })).toEqual({
      q: "devis",
      type: "image",
      sort: "date-asc",
      page: 3,
    });
  });

  it("ignores unknown values", () => {
    expect(parseQuery({ type: "music", sort: "size", page: "-2" })).toEqual(DEFAULT_QUERY);
    expect(parseQuery({ page: "abc" }).page).toBe(1);
  });

  it("writes only what differs from the default", () => {
    expect(queryString(DEFAULT_QUERY)).toBe("");
    expect(queryString({ q: "été", type: "folder", sort: "name-desc", page: 2 })).toBe(
      "?q=%C3%A9t%C3%A9&type=folder&sort=name-desc&page=2",
    );
  });
});

describe("sorting by a column", () => {
  it("sorts, then reverses on a second click", () => {
    expect(nextSort("name", "name")).toBe("name-desc");
    expect(nextSort("name-desc", "name")).toBe("name");
    expect(nextSort("name", "date")).toBe("date");
    expect(nextSort("date", "date")).toBe("date-asc");
  });
});

describe("search", () => {
  it("ignores capitals and accents", () => {
    expect(searchText("  Été Œuvre ")).toBe("ete oeuvre");
  });

  it("takes % and _ literally", () => {
    expect(containsPattern("100%_ok")).toBe("%100\\%\\_ok%");
  });
});

describe("pagination", () => {
  it("counts pages of 50", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(50)).toBe(1);
    expect(pageCount(51)).toBe(2);
  });

  it("writes the range", () => {
    expect(rangeLabel(1, 132)).toBe("1–50 sur 132");
    expect(rangeLabel(3, 132)).toBe("101–132 sur 132");
  });

  it("shows the first, the current page and its neighbours, the last", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(1, 3)).toEqual([1, 2, 3]);
    expect(pageNumbers(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    // A gap of a single page shows it.
    expect(pageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
    expect(pageNumbers(10, 10)).toEqual([1, "gap", 9, 10]);
  });
});

describe("errors of the database", () => {
  it("names the rule broken", () => {
    expect(problemOf({ message: "drive_storage_full" })).toBe("storage_full");
    expect(problemOf({ message: "drive_too_many_uploads" })).toBe("too_many_uploads");
    expect(problemOf({ message: "drive_depth_limit_reached" })).toBe("depth");
    expect(problemOf({ message: "drive_move_into_itself" })).toBe("into_itself");
    expect(problemOf({ code: "23505", message: 'duplicate key value violates unique constraint "drive_items_name_key"' })).toBe(
      "name_taken",
    );
    expect(problemOf({ message: "something else" })).toBeNull();
  });
});
