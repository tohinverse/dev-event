import { Suspense } from "react"
import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { getEvents } from "@/lib/actions/event.actions"

const FeaturedEvents = async () => {
	const events = await getEvents();

	return (
		<ul className="events">
			{events && events.length > 0 && events.map((event) => (
				<li key={event.slug} className="list-none">
					<EventCard {...event} />
				</li>
			))}
		</ul>
	)
}

const Page = () => {
	return (
		<section>
			<h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
			<p className="text-center mt-5">
				Hackathons, Meetups and Conferences. All in One Place.
			</p>
			<ExploreBtn />
			<div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

				<Suspense fallback={<p>Loading events...</p>}>
					<FeaturedEvents />
				</Suspense>
            </div>
		</section>
	)
}

export default Page
