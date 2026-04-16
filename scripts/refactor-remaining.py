import os

# === video-script: Replace BottomSheet with ImagePromptSheet ===
with open('src/app/(dashboard)/create/video-script/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add import
c = c.replace(
    "import BottomSheet from '@/components/ui/BottomSheet'",
    "import ImagePromptSheet from '../components/ImagePromptSheet'"
)

# Remove unused imports
c = c.replace(", AI_TOOL_OPTIONS, IMAGE_STYLE_DETAIL_OPTIONS", "")

# Remove BottomSheet state vars
for line in [
    "  const [imgAiTool, setImgAiTool] = useState('Midjourney')\n",
    "  const [imgStyleDetail, setImgStyleDetail] = useState('모던')\n",
    "  const [imgGenerating, setImgGenerating] = useState(false)\n",
]:
    c = c.replace(line, '')

# Remove handleGenerateImagePrompt function
fn_start = c.find("  const handleGenerateImagePrompt = async () => {")
if fn_start > -1:
    fn_end = c.find("\n  }\n\n  return", fn_start)
    if fn_end > -1:
        c = c[:fn_start] + c[fn_end + 4:]

# Replace BottomSheet JSX
sheet_start = c.find("      {/* 이미지 프롬프트 BottomSheet */}")
if sheet_start > -1:
    sheet_end = c.find("      </BottomSheet>", sheet_start)
    if sheet_end > -1:
        sheet_end += len("      </BottomSheet>")
        old = c[sheet_start:sheet_end]
        new = """      <ImagePromptSheet
        open={imgSheetOpen}
        onClose={() => setImgSheetOpen(false)}
        projectId={projectId}
        channel="video_script"
        fixedSize={format === 'short' ? '1080x1920' : '1920x1080'}
        imageStyle={imageStyle}
        onGenerated={(result) => setImgResult({ images: result.images, thumbnail: result.thumbnail })}
      />"""
        c = c.replace(old, new)

with open('src/app/(dashboard)/create/video-script/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print(f"video-script: {len(c.splitlines())} lines")

# === pricing: Extract PlanCard ===
with open('src/app/(dashboard)/pricing/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the unused FEATURES constant (comparison table uses it but is conditional)
# Actually keep it, just note - pricing is 424 lines, mostly static data
# The biggest win is extracting the plan card rendering

# For pricing, the SVG check icon is repeated 7 times. Extract it inline.
check_svg = """<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0" aria-hidden="true">
                      <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>"""

# Count occurrences
count = c.count(check_svg)
if count > 1:
    # Add a CheckIcon at the top of the component
    c = c.replace(
        "export default function PricingPage() {",
        """const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0" aria-hidden="true">
    <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function PricingPage() {"""
    )
    c = c.replace(check_svg, "<CheckIcon />")

with open('src/app/(dashboard)/pricing/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print(f"pricing: {len(c.splitlines())} lines")

# === contents/[id]: Extract ContentSidebar ===
# This is complex, skip for now - 408 lines is manageable with the fixes already done

print("Done with batch refactoring")
