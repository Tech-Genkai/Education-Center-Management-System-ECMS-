const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'views', 'admin', 'dashboard.ejs');
let content = fs.readFileSync(filePath, 'utf8');

// Fix first loadStudents function - change to use a function that extracts email first
content = content.replace(
  /if \(data\.students && data\.students\.length > 0\) \{\s+tbody\.innerHTML = data\.students\.map\(student => `/,
  `if (data.students && data.students.length > 0) {
                    tbody.innerHTML = data.students.map(student => {
                        const email = (student.userId && student.userId.email) || 'N/A';
                        return \``
);

// Fix the closing of map function in first loadStudents
content = content.replace(
  /\s+\)\)\.join\(''\);(\s+} else \{\s+tbody\.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-500 dark:text-gray-400">No students found<\/td><\/tr>';)/,
  `\`;
                    }).join('');$1`
);

// Replace onclick handlers to use window.functionName and extract email before
content = content.replace(
  /onclick="(\w+)\('(student|teacher|admin)', '\$\{(\w+)\._id\}', '\$\{\3\.firstName\} \$\{\3\.lastName\}', '\$\{\3\.userId\?\.email \|\| 'N\/A'\}'\)"/g,
  'onclick="window.$1(\'$2\', \'${$3._id}\', \'${$3.firstName} ${$3.lastName}\', \'${email}\')"'
);

// Also update the second and third occurrences (for other load functions)
content = content.replace(
  /window\.loadTeachers = async function\(\) \{[\s\S]*?if \(data\.teachers && data\.teachers\.length > 0\) \{\s+tbody\.innerHTML = data\.teachers\.map\(teacher => `/,
  match => match.replace(
    /tbody\.innerHTML = data\.teachers\.map\(teacher => `/,
    `tbody.innerHTML = data.teachers.map(teacher => {
                        const email = (teacher.userId && teacher.userId.email) || 'N/A';
                        return \``
  )
);

content = content.replace(
  /window\.loadAdmins = async function\(\) \{[\s\S]*?if \(data\.superAdmins && data\.superAdmins\.length > 0\) \{\s+tbody\.innerHTML = data\.superAdmins\.map\(admin => `/,
  match => match.replace(
    /tbody\.innerHTML = data\.superAdmins\.map\(admin => `/,
    `tbody.innerHTML = data.superAdmins.map(admin => {
                        const email = (admin.userId && admin.userId.email) || 'N/A';
                        return \``
  )
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Dashboard fixed successfully!');
