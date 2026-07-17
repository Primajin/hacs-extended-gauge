const fs = require('fs');
const content = fs.readFileSync('src/ui-editor/ui-editor.ts', 'utf8');

const replacement = `          case "entity": {
            const entity = sectionConfigData?.entity;
            if (entity) {
              // add unit of measurement, if entity exists
              const stateObj = this.hass.states[entity];
              if (stateObj) {
                // add unit of measurement, if entity has one
                const unitOfMeasurement =
                  stateObj.attributes.unit_of_measurement;
                if (!sectionConfigData.settings)
                  sectionConfigData.settings = {};
                else
                  sectionConfigData.settings = {
                    ...sectionConfigData.settings,
                  };
                if (unitOfMeasurement) {
                  sectionConfigData.settings.unit_of_measurement =
                    unitOfMeasurement;
                } else delete sectionConfigData.settings.unit_of_measurement;
              }
            } else {
              // remove unit of measurement, if entity is removed
              if (
                sectionConfigData?.settings?.unit_of_measurement != undefined
              ) {
                sectionConfigData.settings = { ...sectionConfigData.settings };
                delete sectionConfigData.settings.unit_of_measurement;
              }
            }
            pageConfigData[sectionName] = sectionConfigData;
            break;
          }
          case "main": {
            if (sectionConfigData.display_mode !== undefined && sectionConfigData.show_needle !== undefined) {
              sectionConfigData = { ...sectionConfigData };
              delete sectionConfigData.show_needle;
              pageConfigData[sectionName] = sectionConfigData;
            }
            break;
          }`;

const newContent = content.replace(/case "entity": \{[\s\S]*?pageConfigData\[sectionName\] = sectionConfigData;\n            break;\n          \}/, replacement);

fs.writeFileSync('src/ui-editor/ui-editor.ts', newContent);
