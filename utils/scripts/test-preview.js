const fs = require('fs');

const { exampleAqiGradient } = require('./generate-previews');
// Actually, we can't easily extract just exampleAqiGradient since it's in a file that does a lot.
// Let's just run sed to create a dial_only preview.
