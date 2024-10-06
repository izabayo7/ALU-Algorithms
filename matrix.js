const fs = require('fs');
const readline = require('readline'); // Import the readline module

class SparseMatrix {
    /**
     * Represents a sparse matrix.
     */

    constructor(numRows, numCols) {
        this.rows = numRows;
        this.cols = numCols;
        this.elements = {}; // Initialize the elements object
    }

    static fromFile(matrixFilePath) {
        try {
            const fileContent = fs.readFileSync(matrixFilePath, "utf-8");
            const lines = fileContent.split('\n');

            if (lines.length < 2) {
                throw new Error(
                    `File ${matrixFilePath} does not contain enough lines for matrix dimensions`
                );
            }

            // Parse dimensions
            const rowMatch = /^rows=(\d+)/.exec(lines[0].trim()); // Use regex
            const colMatch = /^cols=(\d+)/.exec(lines[1].trim()); // Use regex

            if (!rowMatch || !colMatch) {
                throw new Error(
                    `Invalid dimension format in file ${matrixFilePath}. Expected 'rows=X' and 'cols=Y'`
                );
            }

            const totalRows = parseInt(rowMatch[1]);
            const totalCols = parseInt(colMatch[1]);

            const sparseMatrix = new SparseMatrix(totalRows, totalCols);

            // Parse elements
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line === "") continue; // Skip empty lines

                const match = /^\((\d+),\s*(\d+),\s*(-?\d+)\)/.exec(line);
                if (!match) {
                    throw new Error(
                        `Invalid format at line ${i + 1} in file ${matrixFilePath}: ${line}`
                    );
                }

                const row = parseInt(match[1]);
                const col = parseInt(match[2]);
                const value = parseInt(match[3]);

                sparseMatrix.setElement(row, col, value);
            }

            return sparseMatrix;
        } catch (error) {
            throw error.code === 'ENOENT' ? new Error(`File not found: ${matrixFilePath}`) : error;
        }
    }

    getElement(row, col) {
        /**
         * Retrieves the value of an element at a specific row and column.
         *
         * @param row: The row index of the element.
         * @param col: The column index of the element.
         * @return: The value at the specified position, or 0 if not set.
         */
        const key = `${row},${col}`;
        return key in this.elements ? this.elements[key] : 0; // Return the value or 0 if not found
    }

    setElement(row, col, value) {
        /**
         * Sets the value of an element at a specific row and column.
         *
         * @param row: The row index where the value should be set.
         * @param col: The column index where the value should be set.
         * @param value: The value to set at the specified position.
         */
        if (row >= this.rows) {
            this.rows = row + 1; // Update rows if needed
        }
        if (col >= this.cols) {
            this.cols = col + 1; // Update columns if needed
        }

        const key = `${row},${col}`;
        this.elements[key] = value; // Set the value in the object
    }

    add(other) {
        /**
         * Adds two sparse matrices.
         *
         * @param other: The other SparseMatrix to add.
         * @return: A new SparseMatrix that is the sum of the two matrices.
         */
        if (this.rows !== other.rows || this.cols !== other.cols) {
            throw new Error("Matrices must have the same dimensions for addition.");
        }

        const result = new SparseMatrix(this.rows, this.cols);

        // Add elements from the first matrix
        for (const key in this.elements) {
            const value = this.elements[key];
            const [row, col] = key.split(',').map(Number);
            result.setElement(row, col, value);
        }

        // Add elements from the second matrix
        for (const key in other.elements) {
            const value = other.elements[key];
            const [row, col] = key.split(',').map(Number);
            const currentValue = result.getElement(row, col);
            result.setElement(row, col, currentValue + value);
        }

        return result;
    }

    subtract(other) {
        /**
         * Subtracts one sparse matrix from another.
         *
         * @param other: The other SparseMatrix to subtract.
         * @return: A new SparseMatrix that is the result of the subtraction.
         */
        if (this.rows !== other.rows || this.cols !== other.cols) {
            throw new Error("Matrices must have the same dimensions for subtraction.");
        }

        const result = new SparseMatrix(this.rows, this.cols);

        // Subtract elements from the second matrix from the first matrix
        for (const key in this.elements) {
            const value = this.elements[key];
            const [row, col] = key.split(',').map(Number);
            result.setElement(row, col, value);
        }

        for (const key in other.elements) {
            const value = other.elements[key];
            const [row, col] = key.split(',').map(Number);
            const currentValue = result.getElement(row, col);
            result.setElement(row, col, currentValue - value);
        }

        return result;
    }

    multiply(other) {
        /**
         * Multiplies two sparse matrices.
         *
         * @param other: The other SparseMatrix to multiply.
         * @return: A new SparseMatrix that is the product of the two matrices.
         */
        if (this.cols !== other.rows) {
            throw new Error("Number of columns of first matrix must equal number of rows of second matrix.");
        }

        const result = new SparseMatrix(this.rows, other.cols);

        // Multiply matrices
        for (const key in this.elements) {
            const value = this.elements[key];
            const [row, col] = key.split(',').map(Number);
            for (let k = 0; k < other.cols; k++) {
                const otherValue = other.getElement(col, k);
                if (otherValue !== 0) {
                    const currentValue = result.getElement(row, k);
                    result.setElement(row, k, currentValue + value * otherValue);
                }
            }
        }

        return result;
    }

    toString() {
        /**
         * Converts the SparseMatrix to a string representation.
         *
         * @return: The string representation of the SparseMatrix.
         */
        let result = `rows=${this.rows}\ncols=${this.cols}\n`;
        for (const key in this.elements) {
            const value = this.elements[key];
            result += `(${key.split(',')[0]}, ${key.split(',')[1]}, ${value})\n`;
        }
        return result.trim(); // Return trimmed string
    }

    saveToFile(filePath) {
        /**
         * Saves the SparseMatrix to a file.
         *
         * @param filePath: The path to save the matrix file.
         */
        const content = this.toString(); // Get string representation
        fs.writeFileSync(filePath, content); // Write to file
    }
}

function operationsFunc() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Helper function to ask questions
    const askQuestion = (query) => {
        return new Promise((resolve) => {
            rl.question(query, resolve);
        });
    };

    (async () => {
        try {
            // Define available operations
            const matrixOperations = {
                'a': { name: "addition", method: "add" },
                'b': { name: "subtraction", method: "subtract" },
                'c': { name: "multiplication", method: "multiply" },
            };

            // Display the operations menu
            console.log("Menu :");
            for (const key in matrixOperations) {
                const operation = matrixOperations[key];
                console.log(`${key}: ${operation.name}`);
            }

            const matrixFilePath1 = await askQuestion("Enter the file path for the first matrix: ");
            const matrix1 = SparseMatrix.fromFile(matrixFilePath1);

            const matrixFilePath2 = await askQuestion("Enter the file path for the second matrix: ");
            const matrix2 = SparseMatrix.fromFile(matrixFilePath2);

            const operationChoice = await askQuestion("Choose an option (a, b, or c): ");
            const operation = matrixOperations[operationChoice];

            if (!operation) {
                throw new Error("Invalid option.");
            }

            const resultMatrix = matrix1[operation.method](matrix2);
            console.log(`Output of ${operation.name}........\n`);

            const outputFilePath = await askQuestion("Enter the file path to save the result: ");
            resultMatrix.saveToFile(outputFilePath);
            console.log(`Output file saved to ${outputFilePath}`);
        } catch (error) {
            console.log("Error:", error.message);
        } finally {
            rl.close();
        }
    })();
}

operationsFunc();

