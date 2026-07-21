const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/**/*.tsx');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('title: "Điểm NV đánh giá"')) {
        content = content.replace(/title: "Điểm NV đánh giá"/g, 'title: <div style={{ whiteSpace: "nowrap" }}>Điểm NV đánh giá</div>');
        changed = true;
    }
    if (content.includes('title: "Điểm quản lý"')) {
        content = content.replace(/title: "Điểm quản lý"/g, 'title: <div style={{ whiteSpace: "nowrap" }}>Điểm quản lý</div>');
        changed = true;
    }
    
    // Also try to bump width: 120 to width: 130 if it's near these properties, but it's easier to just use whiteSpace: nowrap which overrides wrapping anyway.

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});
