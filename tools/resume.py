"""Build the CV as a .docx.

    python3 tools/resume.py screen resume.docx      # one page, links, accent colour (for the site)
    python3 tools/resume.py print  out/CV.docx      # A4 paper: black text, bigger type, phone number
    python3 tools/resume.py remote out/CV.docx      # print layout with Kathmandu, Nepali number, remote wording

Needs python-docx. Convert to PDF with:
    soffice --headless --convert-to pdf <file>.docx
"""
import json
import sys
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

NAME = "SUMAN CHAULAGAIN"
TITLE = "Backend Software Engineer"
# Phone numbers live in tools/private.json (gitignored) so they stay out of the public repo:
#   {"phone": "+353 ...", "remote_phone": "+977 ..."}
PRIVATE_FILE = Path(__file__).with_name("private.json")
LINKS = [
    ("sumchaulagain@gmail.com", "mailto:sumchaulagain@gmail.com"),
    ("linkedin.com/in/suman-chaulagain", "https://linkedin.com/in/suman-chaulagain"),
    ("github.com/Schaulagain", "https://github.com/Schaulagain"),
    ("sumanchaulagain.info.np", "https://sumanchaulagain.info.np/?ref=cv"),  # ref shows up in GoatCounter
]

PROFILE = (
    "Software engineer with almost 4 years of backend experience, mostly in PHP and Laravel. "
    "Built and looked after the payment system for a cloud self-service portal, and worked on its "
    "virtual machine and hosting features. Freelancing since 2025 on my own IoT and home server "
    "projects."
)
OPEN_TO = "Open to backend, infrastructure or IoT roles in Ireland, abroad or remote."
REMOTE_OPEN_TO = "Looking for remote backend work on European, UK or Gulf hours, and open to relocation."
ATHLONE = "Athlone, Co. Westmeath, Ireland"

SKILLS = [
    ("Backend", "PHP, Laravel, Livewire, REST APIs, WebSockets"),
    ("Payments", "eSewa, Khalti, HBL, IME Pay"),
    ("Frontend", "JavaScript, jQuery, HTML, CSS"),
    ("Databases", "MySQL, PostgreSQL"),
    ("Infrastructure", "Linux, Nginx, Apache, Docker, Tailscale, GitHub Actions, VMware vSphere, cPanel/WHM"),
    ("IoT", "ESP32, MQTT, sensors and relays"),
    ("Other", "Python, TypeScript, Git, Jira"),
]

JOBS = [
    ("Freelance Software Developer", "Self-employed, remote", "Jan 2025 – Present", [
        "Built and ran my own projects, listed below.",
    ]),
    ("Web Application Developer", "Accessworld Tech, Lalitpur, Nepal", "Apr 2023 – Dec 2024", [
        "Built and looked after the payment system for a cloud self-service portal, which every "
        "customer purchase went through, as one of two backend developers.",
        "Connected the portal to VMware vSphere so customers could create and manage their own "
        "virtual machines.",
        "Automated the hosting, email and domain products through third-party APIs.",
        "Worked with banking and education clients on requirements and deployed to Linux servers.",
    ]),
    ("Backend Developer", "Tech 101, Kathmandu, Nepal", "Nov 2021 – Apr 2023", [
        "Built REST APIs in PHP and Laravel for web and mobile apps, including the admin portal of a "
        "phone exchange platform.",
        "Designed MySQL databases and sped up slow queries.",
    ]),
    ("Software Engineer", "Red Tail Fox, Kathmandu, Nepal", "Mar 2021 – Oct 2021", [
        "Added online payments to a gaming site and turned it into a Progressive Web App.",
        "Worked on the backends of an e-sports tournament site and a video streaming service.",
    ]),
]

PROJECTS = [
    ("Water Tank Controller", "github.com/Schaulagain/water-tank-controller",
     "ESP32, MQTT, Laravel, Docker",
     "A device that fills the roof tank by itself and keeps the pump safe, with live tank levels on a phone."),
    ("Laravel Nepal Payments", "github.com/Schaulagain/laravel-nepal-payments",
     "Laravel, PHPUnit, GitHub Actions",
     "A demo store that takes payments through three gateways and only counts a payment once the gateway confirms it."),
    ("Homelab", "github.com/Schaulagain/my-homelab",
     "Ubuntu Server, Docker, Tailscale",
     "An old laptop turned into a home server for ad blocking and media, reachable from outside over Tailscale."),
]

EDUCATION = ("BSc (Hons) Computing (Software Engineering)",
             "University of Northampton, Northampton, UK", "Sep 2017 – Sep 2020")

STYLES = {
    "screen": dict(margin=Cm(1.4), body=9.5, small=9, head=10, name=18, gap=2, spacing=1.08,
                   accent=RGBColor(0x1F, 0x5C, 0x46), muted=RGBColor(0x55, 0x55, 0x55),
                   links=True, location=ATHLONE, phone_key=None, open_to=OPEN_TO),
    "print": dict(margin=Cm(1.8), body=10, small=9.5, head=10.5, name=20, gap=3, spacing=1.04,
                  accent=RGBColor(0, 0, 0), muted=RGBColor(0x33, 0x33, 0x33),
                  links=False, location=ATHLONE, phone_key="phone", open_to=OPEN_TO),
}
# International applications use Kathmandu and the Nepali number; Irish ones use print.
STYLES["remote"] = dict(STYLES["print"], location="Kathmandu, Nepal (UTC+5:45)",
                        phone_key="remote_phone", open_to=REMOTE_OPEN_TO)


def phone_for(key):
    try:
        return json.loads(PRIVATE_FILE.read_text())[key]
    except (FileNotFoundError, KeyError):
        sys.exit(f"{PRIVATE_FILE} needs a {key!r} entry for this mode")


def build(mode, out):
    s = STYLES[mode]
    d = docx.Document()
    sec = d.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin = sec.right_margin = s["margin"]
    sec.top_margin = sec.bottom_margin = min(s["margin"], Cm(1.5))
    text_width = sec.page_width - 2 * s["margin"]
    normal = d.styles["Normal"]
    normal.font.name = "Arial"
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    normal.font.size = Pt(s["body"])
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.line_spacing = s["spacing"]

    def para(after=0, before=0, align=None, style=None):
        p = d.add_paragraph(style=style)
        p.paragraph_format.space_after = Pt(after)
        p.paragraph_format.space_before = Pt(before)
        if align:
            p.alignment = align
        return p

    def run(p, text, size=None, bold=False, italic=False, color=None):
        r = p.add_run(text)
        r.font.size = Pt(size or s["body"])
        r.bold, r.italic = bold, italic
        if color is not None:
            r.font.color.rgb = color
        return r

    def link(p, text, url):
        if not s["links"]:
            return run(p, text, size=s["small"])
        h = OxmlElement("w:hyperlink")
        h.set(qn("r:id"), d.part.relate_to(url, docx.opc.constants.RELATIONSHIP_TYPE.HYPERLINK,
                                             is_external=True))
        r = OxmlElement("w:r")
        rpr = OxmlElement("w:rPr")
        for tag, val in (("w:color", "1F5C46"), ("w:sz", str(int(s["small"] * 2)))):
            e = OxmlElement(tag); e.set(qn("w:val"), val); rpr.append(e)
        r.append(rpr)
        t = OxmlElement("w:t"); t.text = text; r.append(t)
        h.append(r)
        p._p.append(h)

    def right_tab(p):
        p.paragraph_format.tab_stops.add_tab_stop(text_width, WD_TAB_ALIGNMENT.RIGHT)

    def heading(text):
        p = para(after=3, before=8)
        run(p, text.upper(), size=s["head"], bold=True, color=s["accent"])
        border = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        for k, v in (("w:val", "single"), ("w:sz", "6"), ("w:space", "1"), ("w:color", "999999")):
            bottom.set(qn(k), v)
        border.append(bottom)
        p._p.get_or_add_pPr().append(border)

    def bullet(text):
        p = para(after=1, style="List Bullet")
        p.paragraph_format.left_indent = Cm(0.5)
        p.paragraph_format.first_line_indent = Cm(-0.35)
        run(p, text)

    def title_line(left, right, before=s["gap"]):
        p = para(before=before)
        right_tab(p)
        run(p, left, size=s["head"], bold=True)
        run(p, "\t" + right, size=s["small"], color=s["muted"])

    def sub_line(text):
        run(para(after=1), text, size=s["small"], italic=True, color=s["muted"])

    # header
    run(para(align=WD_ALIGN_PARAGRAPH.CENTER), NAME, size=s["name"], bold=True)
    run(para(after=1, align=WD_ALIGN_PARAGRAPH.CENTER), TITLE, size=s["body"] + 1, bold=True,
        color=s["accent"])
    links = LINKS
    where = s["location"]
    if s["phone_key"]:  # paper copies: phone and website share the location line so the links fit
        where += f"  |  {phone_for(s['phone_key'])}  |  {LINKS[-1][0]}"
        links = LINKS[:-1]
    run(para(align=WD_ALIGN_PARAGRAPH.CENTER), where, size=s["small"])
    p = para(align=WD_ALIGN_PARAGRAPH.CENTER)
    for i, (text, url) in enumerate(links):
        if i:
            run(p, "  |  ", size=s["small"])
        link(p, text, url)

    heading("Profile")
    run(para(), f"{PROFILE} {s['open_to']}")

    heading("Skills")
    for label, items in SKILLS:
        p = para(after=1)
        run(p, f"{label}: ", bold=True)
        run(p, items)

    heading("Experience")
    for i, (role, company, dates, bullets) in enumerate(JOBS):
        title_line(role, dates, before=0 if i == 0 else s["gap"] + 3)
        sub_line(company)
        for b in bullets:
            bullet(b)

    heading("Projects")
    for i, (name, url, stack, line) in enumerate(PROJECTS):
        title_line(name, url, before=0 if i == 0 else s["gap"] + 2)
        sub_line(stack)
        bullet(line)

    heading("Education")
    title_line(EDUCATION[0], EDUCATION[2], before=0)
    sub_line(EDUCATION[1])

    d.core_properties.title = "Suman Chaulagain - CV"
    d.core_properties.author = "Suman Chaulagain"
    d.save(out)


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
