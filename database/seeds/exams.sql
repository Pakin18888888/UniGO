-- ============================================================================
-- Seed: หมวดหมู่ข้อสอบและชุดข้อสอบตัวอย่าง (Exam Library) พร้อมลิงก์แนวข้อสอบจริง
-- ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
-- แหล่งอ้างอิงทางการ:
--   - TGAT / TPAT / A-Level: โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. (www.mytcas.com/blueprint)
--   - IELTS: ตัวอย่างข้อสอบจริงพร้อมเฉลยจาก IELTS.org
--   - Digital SAT: ข้อสอบจำลองและเฉลยอย่างเป็นทางการจาก College Board & Khan Academy
-- หมายเหตุ: ใช้ ON DUPLICATE KEY UPDATE เพื่อให้รันซ้ำแล้วอัปเดตลิงก์ได้โดยไม่สร้างแถวซ้ำ
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. exam_categories (5 หมวดหมู่หลัก)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO exam_categories (id, slug, name, description)
VALUES
  (1, 'tgat', 'TGAT', 'การทดสอบความถนัดทั่วไป (General Aptitude Test) สำหรับยื่น TCAS'),
  (2, 'tpat', 'TPAT', 'การทดสอบความถนัดทางวิชาชีพ (Professional Aptitude Test) เช่น แพทย์ วิศวะ สถาปัตย์'),
  (3, 'a-level', 'A-Level', 'การทดสอบวิชาการประยุกต์ 9 วิชาหลัก สำหรับรอบรับตรงและ Admission'),
  (4, 'ielts', 'IELTS', 'ข้อสอบวัดระดับภาษาอังกฤษระดับสากล สำหรับหลักสูตรนานาชาติ'),
  (5, 'sat', 'SAT', 'ข้อสอบวัดความถนัดภาษาอังกฤษและคณิตศาสตร์ สำหรับหลักสูตรนานาชาติ');

-- ----------------------------------------------------------------------------
-- 2. exams (15 ชุดข้อสอบพร้อมลิงก์แนวข้อสอบจริงที่เปิดได้ทันที)
-- ----------------------------------------------------------------------------
INSERT INTO exams
  (id, category_id, title, subject, exam_year, difficulty, duration_minutes, total_questions, summary, file_url, answer_key_url)
VALUES
  (1, 1, 'TGAT1 91 การสื่อสารภาษาอังกฤษ (MyTCAS Blueprint)', 'ภาษาอังกฤษ', 2567, 'medium', 60, 60, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. เน้น Speaking Skill และ Reading Comprehension รูปแบบบทสนทนาและบทความสั้น', 'https://www.mytcas.com/blueprint/tgat1-91/', 'https://www.mytcas.com/blueprint/'),
  (2, 1, 'TGAT2 92 การคิดอย่างมีเหตุผล (MyTCAS Blueprint)', 'การคิดอย่างมีเหตุผล', 2567, 'medium', 60, 80, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. ครอบคลุมความสามารถทางภาษา ตัวเลข มิติสัมพันธ์ และเหตุผล', 'https://www.mytcas.com/blueprint/tgat2-92/', 'https://www.mytcas.com/blueprint/'),
  (3, 1, 'TGAT3 93 สมรรถนะการทำงาน (MyTCAS Blueprint)', 'สมรรถนะการทำงาน', 2567, 'easy', 60, 60, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. วัดทักษะการสร้างคุณค่า นวัตกรรม การแก้ปัญหาที่ซับซ้อน และการเป็นพลเมืองที่มีส่วนร่วม', 'https://www.mytcas.com/blueprint/tgat3-93/', 'https://www.mytcas.com/blueprint/'),
  (4, 2, 'TPAT1 วิชาเฉพาะ กสพท (ความถนัดแพทย์)', 'เชาวน์ปัญญา-จริยธรรม-เชื่อมโยง', 2567, 'hard', 195, 140, 'แบ่งเป็น 3 พาร์ต: เชาวน์ปัญญา จริยธรรมทางการแพทย์ และทักษะการเชื่อมโยง (จัดสอบโดย กสพท และประกาศร่วมผ่านระบบ MyTCAS)', 'https://www.mytcas.com/blueprint/', 'https://www.mytcas.com/news/'),
  (5, 2, 'TPAT3 30 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์ (MyTCAS Blueprint)', 'ความถนัดวิศวกรรม', 2567, 'hard', 180, 70, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. เน้นการคิดเชิงวิศวกรรม มิติสัมพันธ์ ตัวเลข กลศาสตร์ และข่าวสารเทคโนโลยีปัจจุบัน (สำคัญมากสำหรับเข้าวิศวะ/IT มจธ.)', 'https://www.mytcas.com/blueprint/tpat3-30/', 'https://www.mytcas.com/blueprint/'),
  (6, 2, 'TPAT4 40 ความถนัดทางสถาปัตยกรรม (MyTCAS Blueprint)', 'ความถนัดสถาปัตยกรรม', 2567, 'medium', 180, 40, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. ความรู้พื้นฐานทางสถาปัตยกรรม การมองภาพ 3 มิติ และโครงสร้างเบื้องต้น', 'https://www.mytcas.com/blueprint/tpat4-40/', 'https://www.mytcas.com/blueprint/'),
  (7, 3, 'A-Level 61 คณิตศาสตร์ประยุกต์ 1 (Math 1) (MyTCAS Blueprint)', 'คณิตศาสตร์ประยุกต์ 1', 2567, 'hard', 90, 30, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. สายวิทย์-คณิต ครอบคลุมแคลคูลัส สถิติ ความน่าจะเป็น ฟังก์ชัน และเวกเตอร์', 'https://www.mytcas.com/blueprint/a-level-61-math1/', 'https://www.mytcas.com/blueprint/'),
  (8, 3, 'A-Level 62 คณิตศาสตร์ประยุกต์ 2 (Math 2) (MyTCAS Blueprint)', 'คณิตศาสตร์ประยุกต์ 2', 2567, 'medium', 90, 30, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. เน้นคณิตศาสตร์พื้นฐาน เซต ตรรกศาสตร์ ลำดับอนุกรม ดอกเบี้ย และสถิติ', 'https://www.mytcas.com/blueprint/a-level-62-math2/', 'https://www.mytcas.com/blueprint/'),
  (9, 3, 'A-Level 64 ฟิสิกส์ (MyTCAS Blueprint)', 'ฟิสิกส์', 2567, 'hard', 90, 30, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. กลศาสตร์ คลื่น ไฟฟ้าแม่เหล็ก และฟิสิกส์แผนใหม่ เน้นการประยุกต์สูตร', 'https://www.mytcas.com/blueprint/a-level-64-phy/', 'https://www.mytcas.com/blueprint/'),
  (10, 3, 'A-Level 65 เคมี (MyTCAS Blueprint)', 'เคมี', 2567, 'hard', 90, 35, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. ปริมาณสารสัมพันธ์ สมดุลเคมี กรด-เบส ไฟฟ้าเคมี และเคมีอินทรีย์', 'https://www.mytcas.com/blueprint/a-level-65-chem/', 'https://www.mytcas.com/blueprint/'),
  (11, 3, 'A-Level 66 ชีววิทยา (MyTCAS Blueprint)', 'ชีววิทยา', 2567, 'medium', 90, 40, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. ระบบร่างกาย พันธุศาสตร์ การสังเคราะห์ด้วยแสง และระบบนิเวศ', 'https://www.mytcas.com/blueprint/a-level-66-bio/', 'https://www.mytcas.com/blueprint/'),
  (12, 3, 'A-Level 82 ภาษาอังกฤษ (MyTCAS Blueprint)', 'ภาษาอังกฤษ', 2567, 'medium', 90, 80, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. Listening & Speaking, Reading และ Writing ในบริบทวิชาการ', 'https://www.mytcas.com/blueprint/a-level-82-eng/', 'https://www.mytcas.com/blueprint/'),
  (13, 3, 'A-Level 81 ภาษาไทย (MyTCAS Blueprint)', 'ภาษาไทย', 2567, 'easy', 90, 50, 'โครงสร้างและตัวอย่างข้อสอบจริงจาก ทปอ. การอ่านจับใจความ การเขียน และหลักการใช้ภาษาไทย', 'https://www.mytcas.com/blueprint/a-level-81-thai/', 'https://www.mytcas.com/blueprint/'),
  (14, 4, 'IELTS Academic Official Sample Test Questions', 'ภาษาอังกฤษ (IELTS)', 2568, 'hard', 165, 80, 'ตัวอย่างข้อสอบ IELTS Academic อย่างเป็นทางการจาก IELTS.org ครบพาร์ต Listening, Academic Reading, Academic Writing และ Speaking พร้อมเฉลย', 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test', 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test'),
  (15, 5, 'Digital SAT Official Practice Tests (College Board)', 'Reading, Writing & Math', 2568, 'hard', 134, 98, 'ข้อสอบจำลอง Digital SAT อย่างเป็นทางการจาก College Board (ดาวน์โหลด PDF พร้อมเฉลยละเอียด) และฝึกทำฟรีบน Khan Academy', 'https://satsuite.collegeboard.org/practice/practice-tests/paper', 'https://www.khanacademy.org/digital-sat')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  subject = VALUES(subject),
  summary = VALUES(summary),
  file_url = VALUES(file_url),
  answer_key_url = VALUES(answer_key_url);
