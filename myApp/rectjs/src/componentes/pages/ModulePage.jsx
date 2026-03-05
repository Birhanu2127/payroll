function ModulePage({ activeItem }) {
  return (
    <section className="focus-panel">
      <h2>{activeItem}</h2>
      <p>
        This module can now be connected to dedicated Laravel API endpoints. The Dashboard module
        already includes working Overview, Analytics, Summary, and Notifications data.
      </p>
    </section>
  )
}

export default ModulePage
