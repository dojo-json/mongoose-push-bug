const mongoose = require("mongoose");
const assert = require("assert");
const { Schema } = mongoose;

mongoose.set("debug", true);

describe("mongoose push error", () => {
  const authorSchema = new Schema(
    {
      name: String,
      books: [
        {
          type: Schema.Types.ObjectId,
          ref: "Book"
        }
      ]
    },
    {
      // useful for 4.x
      usePushEach: true
    }
  );

  const bookSchema = new Schema({
    title: String,
    author: {
      type: Schema.Types.ObjectId,
      ref: "Author"
    }
  });

  const Author = mongoose.model("Author", authorSchema);
  const Book = mongoose.model("Book", bookSchema);

  let isaac;
  let ursula;

  before(async () => {
    await mongoose.connect("mongodb://localhost/push-bug");
    await Author.remove({});
    await Book.remove({});

    isaac = await Author.create({ name: "Asimov" });
    ursula = await Author.create({ name: "Le Guin" });
  });

  after(() => {
    mongoose.connection.close();
  });

  describe("push()", () => {
    it("should push a document into an array", async () => {
      const book = await Book.create({ title: "Foundation" });

      isaac.books.push(book);

      await isaac.save();

      const author = await Author.findById(isaac.id);

      assert.equal(author.books.length, 1);
    });

    it("should push an _id into an array after push()ing a document", async () => {
      const book = await Book.create({ title: "I, Robot" });
      const author = await Author.findById(isaac.id);

      author.books.push(book.id);

      await author.save();
    });

    it("should actually push an _id", async () => {
      const book = await Book.create({ title: "The Dispossessed" });

      ursula.books.push(book.id);

      // this should be successful
      await ursula.save();
    });
  });

  describe("$push", () => {
    it("should $push a document", async () => {
      const book = await Book.create({ title: "The Left Hand of Darkness" });

      const author = await Author.findByIdAndUpdate(ursula.id, {
        $push: { books: book }
      });

      const updatedAuthor = await Author.findById(author.id);

      // this should be successful
      assert.equal(updatedAuthor.books.length, 2);
    });

    it("should $push a document after push()ing", async () => {
      const book = await Book.create({ title: "The Gods Themselves" });

      const author = await Author.findByIdAndUpdate(isaac.id, {
        $push: { books: book }
      });

      const updatedAuthor = await Author.findById(author.id);

      assert.equal(updatedAuthor.books.length > 1, true);
    });
  });
});
