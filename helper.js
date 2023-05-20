module.exports.name_format = (name) => {
  return name.toLowerCase().replace(/^\w/, char=>char.toUpperCase());
}