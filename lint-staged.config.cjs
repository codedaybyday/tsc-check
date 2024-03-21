const {} = require('./');
module.exports = {
    '*.ts': ['node bin/tsc-check --files'],
};
