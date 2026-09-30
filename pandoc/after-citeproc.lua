--- What is left once citeproc has run. The Due Credit plugin runs this after
--- `--citeproc`.
---
--- `--bibliography` and `--csl` are metadata to pandoc, and so is
--- `reference-section-title`. Citeproc reads them, and after it nothing does,
--- except the Word writer, which keeps every metadata key as a custom document
--- property: the bibliography's path on your disk, user name and all, inside
--- the file you send. So they are cleared.
---
--- A style that cites in footnotes leaves two things to finish: a citation in
--- a footnote of your own, and a citation's footnote next to one of yours.

--- Whether the style at `path` cites in footnotes: its `class` is `note`
--- rather than `in-text`. `noteStyle` in the plugin's `src/core/document.ts`
--- reads a style the same way. No style is pandoc's built-in Chicago
--- author-date.
local function note_style(path)
  local file = path and io.open(path, 'r')
  if not file then return false end
  local csl = file:read('a')
  file:close()
  local style = csl:match('<style%f[^%w][^>]*')
  return style ~= nil and style:match('%sclass%s*=%s*["\']note["\']') ~= nil
end

--- A citation in a footnote of your own, without the parentheses citeproc puts
--- around one that follows other words: "see Marsh, *Rivers of Thought*, 5",
--- the way Zotero writes it in a footnote. Citeproc adds them as characters of
--- their own, so nothing the style wrote is taken for one.
local function unparenthesised(cite)
  local content = cite.content
  local first = (content[1] and content[1].t == 'Space') and 2 or 1
  local open, close = content[first], content[#content]
  if #content > first and open.t == 'Str' and open.text == '(' and close.t == 'Str' and close.text == ')' then
    content:remove(#content)
    content:remove(first)
    cite.content = content
    return cite
  end
end

--- The footnote a citation became, or nil when `el` is not one.
local function cited(el)
  if el and el.t == 'Cite' and #el.content == 1 and el.content[1].t == 'Note' then return el.content[1] end
  return nil
end

--- The footnote `el` is, a citation's or one of yours, or nil.
local function note_of(el)
  if el and el.t == 'Note' then return el end
  return cited(el)
end

--- Two footnotes as one, in the order they were written, the first's last
--- paragraph running on into the second's first.
local function joined(a, b)
  local blocks = a.content:clone()
  local rest = b.content:clone()
  local last, first = blocks[#blocks], rest[1]
  if last and first and last.t == 'Para' and first.t == 'Para' then
    blocks[#blocks] = pandoc.Para(last.content .. { pandoc.Space() } .. first.content)
    rest:remove(1)
  end
  blocks:extend(rest)
  return pandoc.Note(blocks)
end

--- A citation's footnote and yours at the same place become one:
--- `A claim [[marsh2019]].[^1]` has one note, the citation and then your
--- words, where citeproc makes two marks side by side. Two of your own stay
--- two, since you put them there, unless a citation joins them. A footnote
--- of yours before the punctuation stays apart from a citation after it, as
--- in `A claim[^1] [[marsh2019]].`: citeproc moves only the citation.
---
--- Citeproc moves a citation's footnote after the punctuation that follows
--- it, and when a footnote of yours stands between the two it copies the
--- full stop rather than moving it: `A claim [[marsh2019]][^1].` would end
--- in two. The copy goes.
local function merged(inlines)
  local out = pandoc.Inlines({})
  local i = 1
  while i <= #inlines do
    local note = note_of(inlines[i])
    local citation = cited(inlines[i]) ~= nil
    local j = i + 1
    while note do
      -- Citeproc leaves an empty word where it took the punctuation from.
      local k = j
      while inlines[k] and inlines[k].t == 'Str' and inlines[k].text == '' do k = k + 1 end
      local next = note_of(inlines[k])
      if not next or not (citation or cited(inlines[k])) then break end
      note = joined(note, next)
      citation = true
      j = k + 1
    end
    if j == i + 1 then
      out:insert(inlines[i])
    else
      local before, after = out[#out], inlines[j]
      out:insert(note)
      if before and before.t == 'Str' and before.text:match('^%p$') and after and after.t == 'Str' and after.text:sub(1, 1) == before.text then
        inlines[j] = pandoc.Str(after.text:sub(2))
      end
    end
    i = j
  end
  return out
end

function Pandoc(doc)
  local csl = doc.meta.csl and pandoc.utils.stringify(doc.meta.csl)
  if note_style(csl) then
    doc = doc:walk({ Note = function(note) return note:walk({ Cite = unparenthesised }) end })
    doc = doc:walk({ Inlines = merged })
  end
  doc.meta.bibliography = nil
  doc.meta.csl = nil
  doc.meta['reference-section-title'] = nil
  return doc
end
