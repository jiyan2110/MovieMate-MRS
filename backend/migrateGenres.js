// migrateGenres.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017/movies';

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db().collection('tmdb1million');

    console.time('add-genres_tokens');
    const upd = await col.updateMany(
      {},
      [
        {
          $set: {
            genres_tokens: {
              $map: {
                input: { $split: ['$genres', ','] },
                as: 'g',
                in: { $trim: { input: '$$g' } }
              }
            }
          }
        }
      ]
    );
    console.timeEnd('add-genres_tokens');
    console.log('Modified docs:', upd.modifiedCount);

    console.time('create-index');
    await col.createIndex({ genres_tokens: 1 });
    console.timeEnd('create-index');
    console.log('Index created on genres_tokens');
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
