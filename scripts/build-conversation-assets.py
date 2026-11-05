from pathlib import Path
import base64,csv,io,json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
r=Path(__file__).resolve().parents[1];out=r/'assets/conversation-materials';out.mkdir(exist_ok=True)
rows=[['月份','个人交付（辆）','统计口径'],['2026年5月',13,'完整月'],['2026年6月',15,'完整月'],['2026年7月',18,'完整月'],['2026年8月',20,'完整月'],['2026年9月',24,'完整月'],['2026年10月',26,'截至29日'],[],['2026年10月截至29日车型交付','数量（辆）'],['宋Pro DM-i',11],['元PLUS',7],['秦PLUS DM-i',5],['汉DM-i',3],['合计',26],[],['人员','销冠顾问'],['门店','深圳南山王朝旗舰店'],['月度目标',25],['目标完成率','104.0%']]
buf=io.StringIO();csv.writer(buf).writerows(rows);(out/'zhou-deliveries.csv').write_bytes(buf.getvalue().encode('utf-8-sig'))
pdfmetrics.registerFont(TTFont('STSong-Light','/System/Library/Fonts/STHeiti Light.ttc',subfontIndex=0));c=canvas.Canvas(str(out/'customer-followup.pdf'),pagesize=(595,842));c.setTitle('客户试驾跟进清单');c.setAuthor('迪客牛仔')
c.setFillColorRGB(.97,.98,.98);c.rect(0,0,595,842,fill=1,stroke=0);c.setFillColorRGB(.027,.694,.78);c.rect(0,826,595,16,fill=1,stroke=0)
c.setFillColorRGB(.06,.07,.06);c.setFont('STSong-Light',27);c.drawString(42,765,'客户试驾跟进清单');c.setFont('STSong-Light',12);c.drawString(42,734,'深圳南山王朝旗舰店 · 销冠顾问销售方法整理')
steps=[('01 需求确认','记录预算、用车人数、通勤路线与补能条件。','确认客户最关注的两项需求，并记录顾虑。'),('02 试驾体验','围绕空间、乘坐感受与驾驶体验安排路线。','试驾结束后，让客户说出满意点与待确认项。'),('03 方案沟通','当天发送对应车型的配置及费用清单。','分别列明车价、权益与金融方案，避免混淆。'),('04 约定跟进','与客户约定下次联系时间和需要补充的资料。','逐项确认待办事项，不以催单代替问题解决。')]
y=682
for title,a,b in steps:
 c.setFillColorRGB(1,1,1);c.roundRect(36,y-107,523,110,12,fill=1,stroke=0);c.setFillColorRGB(.0,.58,.65);c.setFont('STSong-Light',17);c.drawString(54,y-22,title);c.setFillColorRGB(.1,.13,.13);c.setFont('STSong-Light',12);c.drawString(54,y-52,a);c.drawString(54,y-76,b);y-=131
c.setFillColorRGB(.35,.4,.4);c.setFont('STSong-Light',11);c.drawString(42,102,'复盘：两周后检查回访完成情况、客户反馈与交付变化。');c.drawString(42,78,'客户：____________  顾问：____________  下次联系：____________');c.save()
metadata=[dict(key='zhou-deliveries',title='销冠顾问个人交付明细',name='销冠顾问个人交付明细.csv',url='assets/conversation-materials/zhou-deliveries.csv',type='text/csv'),dict(key='customer-followup',title='客户试驾跟进清单',name='客户试驾跟进清单.pdf',url='assets/conversation-materials/customer-followup.pdf',type='application/pdf')]
for item in metadata:item['size']=(r/item['url']).stat().st_size
module=r/'conversation-materials.js'
if module.exists():
 text=module.read_text();start=text.index('  const catalog=');end=text.index('  const get=',start);module.write_text(text[:start]+'  const catalog='+json.dumps(metadata,ensure_ascii=False,indent=2)+';\n'+text[end:])
print([(i['name'],i['size']) for i in metadata])
