--- Obsidian's own syntax that pandoc reads as something else, and that has
--- nothing to do with citations. The Due Credit plugin runs this before the
--- citation filter.

--- A callout's marker: `[!note]`, folded `[!note]-` or open `[!note]+`, and
--- `[!note|wide]` with its settings.
local function marker(el)
  return el ~= nil and el.t == 'Str' and el.text:match('^%[![^%]]+%][+-]?$') ~= nil
end

--- A callout, `> [!note] Title`, which pandoc reads as a quote whose first
--- paragraph opens with the marker, the title running to the first line break.
--- The quote stays, with the title in bold on its first line and the type
--- gone; a callout without a title loses the marker only.
function BlockQuote(quote)
  local first = quote.content[1]
  if first == nil or (first.t ~= 'Para' and first.t ~= 'Plain') then return nil end
  local inlines = first.content
  if not marker(inlines[1]) then return nil end

  local i = 2
  if inlines[i] and inlines[i].t == 'Space' then i = i + 1 end
  local title = pandoc.Inlines({})
  while inlines[i] and inlines[i].t ~= 'SoftBreak' and inlines[i].t ~= 'LineBreak' do
    title:insert(inlines[i])
    i = i + 1
  end
  local rest = pandoc.Inlines({})
  for j = i + 1, #inlines do rest:insert(inlines[j]) end

  local opening = pandoc.Inlines({})
  if #title > 0 then
    opening:insert(pandoc.Strong(title))
    if #rest > 0 then opening:insert(pandoc.LineBreak()) end
  end
  opening:extend(rest)
  local blocks = pandoc.Blocks({})
  if #opening > 0 then blocks:insert(pandoc.Para(opening)) end
  for j = 2, #quote.content do blocks:insert(quote.content[j]) end
  quote.content = blocks
  return quote
end
