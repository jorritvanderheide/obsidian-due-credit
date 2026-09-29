--- Clear what only citeproc needed, once it has run.
---
--- `--bibliography` and `--csl` are metadata to pandoc, and so is
--- `reference-section-title`. Citeproc reads them, and after it nothing does,
--- except the Word writer, which keeps every metadata key as a custom document
--- property: the bibliography's path on your disk, user name and all, inside
--- the file you send. The Due Credit plugin runs this after `--citeproc`.
function Meta(meta)
  meta.bibliography = nil
  meta.csl = nil
  meta['reference-section-title'] = nil
  return meta
end
