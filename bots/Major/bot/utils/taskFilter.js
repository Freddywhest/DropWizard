function taskFilter(tasks, query_name) {
  return tasks.filter((task) => {
    if (typeof query_name == "string") {
      return task.type.toLowerCase() === query_name.toLowerCase();
    } else if (Array.isArray(query_name)) {
      return query_name.includes(task.type.toLowerCase());
    } else {
      return [];
    }
  });
}

module.exports = taskFilter;
