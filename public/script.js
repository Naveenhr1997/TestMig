document.addEventListener("DOMContentLoaded", function () {
    const folderSelect = document.getElementById("folder-select");
    const jsonSelect = document.getElementById("json-select");
    const mergePropertiesButton = document.getElementById("mergePropertiesButton");

    const selectOption = document.createElement("option");
    selectOption.text = "Select Option";
    jsonSelect.appendChild(selectOption);

    folderSelect.addEventListener("change", function () {
        const selectedFolder = folderSelect.value;
        jsonSelect.innerHTML = "";

        const selectOption = document.createElement("option");
        selectOption.text = "Select Option";
        jsonSelect.appendChild(selectOption);

        // JSON based on the selected folder
        fetch(`/api/getJsonFiles?folder=${selectedFolder}`)
            .then(response => response.json())
            .then(data => {
                data.forEach(file => {
                    const option = document.createElement("option");
                    option.text = file;
                    jsonSelect.appendChild(option);
                });
            })
            .catch(error => console.error(error));
    });

    async function searchFileInDestination(destinationName) {
        try {
            const destinationFolderPath = "Destination";
            const response = await fetch(`/api/searchFileInDestination?folder=${destinationFolderPath}&file=${destinationName}`);
            const jsonResponse = await response.json();

            return jsonResponse;
        } catch (error) {
            console.error('Error:', error);
            return { found: false, alert: "Error searching for file in Destination folder." };
        }
    }

    mergePropertiesButton.addEventListener("click", async function () {
        const selectedFolder = folderSelect.value;
        const selectedFile = jsonSelect.value;

        if (selectedFile === "Select Option") {
            console.log("Please select a JSON file.");
            return;
        }

        let existingData;

        try {
            // fetch the contents of the selected JSON file
            const response = await fetch(`/api/getJsonFile?folder=${selectedFolder}&file=${selectedFile}`);
            existingData = await response.json();

            if (!existingData.properties) {
                existingData.properties = {};
            }

            // fetch the contents from the destination file
            const destinationName = existingData.destinationName + ".txt";
            const destinationResponse = await searchFileInDestination(destinationName);

            if (!destinationResponse.found) {
                console.log(destinationResponse.alert);
                alert("Destination not found");
                return;
            }

            const contents = destinationResponse.fileContents.split('\n');
            const keyValuePairs = {};

            contents
                .filter(line => !line.trim().startsWith("#"))
                .map(line => line.replace(/\\/g, ""))
                .forEach(line => {
                    if (line.trim() !== "") {
                        const [key, value] = line.split("=").map(entry => entry.trim());
                        keyValuePairs[key] = value;
                    }
                });

            // Merge the key-value pairs into the properties object
            existingData.properties = {
                ...existingData.properties,
                ...keyValuePairs
            };

            const updatedJsonBlob = new Blob([JSON.stringify(existingData, null, 2)], { type: "application/json" });
            const updatedJsonUrl = URL.createObjectURL(updatedJsonBlob);
            const downloadLink = document.createElement("a");
            downloadLink.href = updatedJsonUrl;
            downloadLink.download = `${selectedFile}`;
            downloadLink.click();

            URL.revokeObjectURL(updatedJsonUrl);

        } catch (error) {
            console.error('Error:', error);
        }
    });

    jsonSelect.addEventListener("change", async function () {
        const selectedFile = jsonSelect.value;
        if (selectedFile === "Select Option") {
            console.log("Please select a JSON file.");
        } else {
            const selectedFolderPath = folderSelect.value;
            fetch(`/api/getJsonFile?folder=${selectedFolderPath}&file=${selectedFile}`)
                .then(response => response.json())
                .then(async parsedData => {
                    if (parsedData.destinationName) {
                        const destinationName1 = parsedData.destinationName;
                        const destinationName = destinationName1 + ".txt";

                        console.log(`Destination Name: ${destinationName}`);

                        await searchFileInDestination(destinationName);
                    } else {
                        console.log("The 'destinationName' attribute is not present in the JSON data.");
                    }
                })
                .catch(error => console.error(error));
        }
    });
});
