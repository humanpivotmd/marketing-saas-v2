import sys

with open('src/app/(dashboard)/keywords/[id]/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add component imports
old = "import { getToken } from '@/lib/auth-client'"
new = """import { getToken } from '@/lib/auth-client'
import TrendChart from './components/TrendChart'
import KeywordMetrics from './components/KeywordMetrics'
import OpportunityList from './components/OpportunityList'"""
c = c.replace(old, new)

# Remove dead SeoScore interface
c = c.replace("""interface SeoScore {
  total: number
  details: {
    titleKeyword: number
    keywordDensity: number
    contentLength: number
    headingStructure: number
    readability: number
    introKeyword: number
    keywordVariation: number
  }
  suggestions: string[]
}

""", '')

# Remove SEO_LABELS constant
seo_labels_start = c.find("const SEO_LABELS:")
seo_labels_end = c.find("}\n\nconst SEO_MAX:", seo_labels_start)
seo_max_end = c.find("}\n\nexport default", seo_labels_start)
if seo_labels_start > -1 and seo_max_end > -1:
    c = c[:seo_labels_start] + c[seo_max_end + 2:]

# Remove seoScore state
c = c.replace("  const [seoScore, _setSeoScore] = useState<SeoScore | null>(null)\n", '')

# Replace TrendChart section
trend_start = c.find("      {/* Trend Chart */}")
if trend_start > -1:
    trend_card_end = c.find("      </Card>\n\n", trend_start)
    if trend_card_end > -1:
        trend_card_end += len("      </Card>\n")
        c = c[:trend_start] + "      <TrendChart trends={trends} loading={loadingTrend} />\n" + c[trend_card_end:]

# Replace SEO Score section (dead code)
seo_start = c.find("      {/* SEO Score")
if seo_start > -1:
    seo_end = c.find("      )}\n\n", seo_start)
    if seo_end > -1:
        seo_end += len("      )}\n")
        c = c[:seo_start] + c[seo_end:]

# Replace Opportunity section
opp_start = c.find("      {/* Keyword Opportunities */}")
if opp_start > -1:
    opp_end = c.find("      </Card>\n\n      {/* Blog Topic", opp_start)
    if opp_end > -1:
        opp_end += len("      </Card>\n")
        c = c[:opp_start] + "      <OpportunityList opportunities={opportunities} mode={mode} />\n" + c[opp_end:]

# Replace Metrics section
metrics_start = c.find("      {/* Grade Card + Metrics */}")
if metrics_start > -1:
    metrics_end = c.find("      </Card>\n      </div>\n\n", metrics_start)
    if metrics_end > -1:
        metrics_end += len("      </Card>\n      </div>\n")
        c = c[:metrics_start] + """      <KeywordMetrics
        keyword={keyword}
        gradeResult={gradeResult}
        mode={mode}
        gradeStyle={gradeStyle}
        analyzingGrade={analyzingGrade}
        grade={grade}
      />\n""" + c[metrics_end:]

with open('src/app/(dashboard)/keywords/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('keywords/[id] refactored successfully')
