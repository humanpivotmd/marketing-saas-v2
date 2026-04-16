with open('src/app/(dashboard)/create/channel-write/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add ImagePromptSheet import
c = c.replace(
    "import {\n  CHANNEL_LABEL_MAP,",
    "import ImagePromptSheet from '../components/ImagePromptSheet'\nimport {\n  CHANNEL_LABEL_MAP,"
)

# Simplify constants import
c = c.replace(
    "import {\n  CHANNEL_LABEL_MAP,\n  AI_TOOL_OPTIONS,\n  IMAGE_STYLE_DETAIL_OPTIONS,\n  IMAGE_SIZE_OPTIONS,\n  IMAGE_SIZE_DEFAULTS,\n} from '@/lib/constants'",
    "import {\n  CHANNEL_LABEL_MAP,\n  IMAGE_SIZE_DEFAULTS,\n} from '@/lib/constants'"
)

# Remove BottomSheet import
c = c.replace("import BottomSheet from '@/components/ui/BottomSheet'\n", '')

# Remove ImagePromptResult interface
c = c.replace("interface ImagePromptResult {\n  channel: string\n  images: { seq: number; description_ko: string; prompt_en: string; placement?: string }[]\n  thumbnail?: { description_ko: string; prompt_en: string }\n}\n\n", '')

# Remove BottomSheet state lines
for line in [
    "  const [aiTool, setAiTool] = useState<string>('Midjourney')\n",
    "  const [imageStyle, setImageStyle] = useState<'photo' | 'illustration'>('photo')\n",
    "  const [styleDetail, setStyleDetail] = useState('미니멀')\n",
    "  const [imageSize, setImageSize] = useState('')\n",
    "  const [generatingImage, setGeneratingImage] = useState(false)\n",
]:
    c = c.replace(line, '')

# Replace old BottomSheet JSX with ImagePromptSheet
sheet_start = c.find("      {/* 이미지 프롬프트 BottomSheet */}")
if sheet_start > -1:
    sheet_end = c.find("      </BottomSheet>", sheet_start)
    if sheet_end > -1:
        sheet_end += len("      </BottomSheet>")
        old = c[sheet_start:sheet_end]
        new = """      <ImagePromptSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        projectId={projectId}
        channel={sheetChannel}
        viewOnly={sheetViewOnly}
        existingResult={imageResults[sheetChannel] || null}
        useMyPrompt={useMyPrompt}
        onGenerated={(result) => {
          setImageResults(prev => ({ ...prev, [sheetChannel]: result }))
          setImageCompleted(prev => ({ ...prev, [sheetChannel]: true }))
        }}
      />"""
        c = c.replace(old, new)

# Remove handleGenerateImage function
hgi_start = c.find("  // Generate image prompt via API")
if hgi_start > -1:
    hgi_end = c.find("  // Move to next channel", hgi_start)
    if hgi_end > -1:
        c = c[:hgi_start] + c[hgi_end:]

# Remove handleNextChannel function
hnc_start = c.find("  // Move to next channel in the BottomSheet")
if hnc_start > -1:
    hnc_end = c.find("\n\n  //", hnc_start + 10)
    if hnc_end > -1:
        c = c[:hnc_start] + c[hnc_end:]

# Remove sizeOptions
c = c.replace("  const sizeOptions = IMAGE_SIZE_OPTIONS[sheetChannel] || IMAGE_SIZE_OPTIONS.blog\n", '')

with open('src/app/(dashboard)/create/channel-write/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('channel-write refactored')
