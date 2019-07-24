const NodeHelper = require('node_helper');
const Airtable = require('airtable');

const data = {
  columns: ['Day', 'Breakfast', 'Lunch', 'Dinner'],
  rows: [
    ['Monday', 'Oats, Masala, damn', 'Maggie', 'Fish'],
    ['Tuesday', 'Oats', 'Maggie', 'Fish'],
    ['Wednesday', 'Oats', 'Maggie', 'Fish'],
    ['Thursday', 'Oats', 'Maggie', 'Fishdmsds, sdjskjasd, 21212, wsdasd'],
    ['Friday', '1232, dasdasd, asdsad', 'Maggie', ''],
  ],
};

module.exports = NodeHelper.create({
  start: function() {
    this.airtableBase = null;
    console.log(this.name + ' helper started ...');
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MMM_AIRTABLE_DATA_FETCH') {
      const { tableConfig } = payload;
      const that = this;
      this.initializeAirtableOnce(tableConfig);
      //console.log({ tableConfig });
      this.airtableBase(tableConfig.workspaceName)
        .select({
          view: 'Grid view',
        })
        .firstPage((err, records) => {
          if (err) {
            reject(err);
            return;
          }
          const allRecords = records.map(record => record.fields);
          const tableData = {
            columns: Object.keys(allRecords[0]),
            rows: allRecords
              .map(record => Object.values(record))
              .slice(0, tableConfig.maxRows),
          };
          console.log({ allRecords });
          console.log({ tableData });
          that.sendSocketNotification('MMM_AIRTABLE_DATA_RECEIVED', {
            tableConfig,
            tableData,
          });
        });
    }
  },

  initializeAirtableOnce: function(config) {
    if (this.airtableInit || !config.airtableAPIKey || !config.airtableBaseId) {
      return;
    }
    Airtable.configure({
      endpointUrl: 'https://api.airtable.com',
      apiKey: config.airtableAPIKey,
    });
    this.airtableBase = Airtable.base(config.airtableBaseId);
  },
});
